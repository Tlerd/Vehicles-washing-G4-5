-- FR-004/FR-005 v2 Phase 3C: transactional booking integrity.
-- Additive and idempotent. Apply to autowash_pro_test and autowash_pro.
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

IF COL_LENGTH('dbo.bookings', 'assigned_bay_id') IS NULL
    ALTER TABLE dbo.bookings ADD assigned_bay_id BIGINT NULL;
GO

-- Existing reservations predate explicit booking assignment. Only an
-- unambiguous single-bay reservation set can be backfilled automatically.
IF EXISTS (
    SELECT reservation.booking_id
    FROM dbo.slot_reservations reservation
    GROUP BY reservation.booking_id
    HAVING COUNT(DISTINCT reservation.bay_id) > 1
)
    THROW 51001, 'A booking has reservations on multiple bays and must be repaired before Phase 3C.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.slot_reservations reservation
    JOIN dbo.bookings booking ON booking.booking_id = reservation.booking_id
    WHERE booking.assigned_bay_id IS NOT NULL
      AND booking.assigned_bay_id <> reservation.bay_id
)
    THROW 51002, 'A reservation conflicts with its existing booking bay assignment.', 1;

UPDATE booking
SET assigned_bay_id = reservation.bay_id
FROM dbo.bookings booking
JOIN (
    SELECT booking_id, MIN(bay_id) AS bay_id
    FROM dbo.slot_reservations
    GROUP BY booking_id
    HAVING COUNT(DISTINCT bay_id) = 1
) reservation ON reservation.booking_id = booking.booking_id
WHERE booking.assigned_bay_id IS NULL;

IF EXISTS (
    SELECT 1
    FROM dbo.slot_reservations reservation
    JOIN dbo.bookings booking ON booking.booking_id = reservation.booking_id
    WHERE booking.assigned_bay_id IS NULL
       OR booking.assigned_bay_id <> reservation.bay_id
)
    THROW 51003, 'Reservation assignment backfill is incomplete or inconsistent.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.bookings booking
    WHERE ISNULL(booking.legacy_financial_snapshot, 0) = 0
      AND (
          (booking.booking_mode = 'SLOT' AND booking.assigned_bay_id IS NULL)
          OR (booking.booking_mode = 'FLEXIBLE' AND booking.assigned_bay_id IS NOT NULL)
      )
)
    THROW 51004, 'Non-legacy booking assignment data must be repaired before Phase 3C.', 1;

IF COL_LENGTH('dbo.vouchers', 'locked_booking_id') IS NULL
    ALTER TABLE dbo.vouchers ADD locked_booking_id BIGINT NULL;

IF COL_LENGTH('dbo.idempotency_records', 'guest_proof_hash') IS NULL
    ALTER TABLE dbo.idempotency_records ADD guest_proof_hash CHAR(64) NULL;

IF COL_LENGTH('dbo.idempotency_records', 'client_key_hash') IS NULL
    ALTER TABLE dbo.idempotency_records ADD client_key_hash CHAR(64) NULL;

IF COL_LENGTH('dbo.idempotency_records', 'response_location') IS NULL
    ALTER TABLE dbo.idempotency_records ADD response_location VARCHAR(200) NULL;

IF COL_LENGTH('dbo.idempotency_records', 'response_cache_control') IS NULL
    ALTER TABLE dbo.idempotency_records ADD response_cache_control VARCHAR(100) NULL;

IF COL_LENGTH('dbo.idempotency_records', 'hash_version') IS NULL
    ALTER TABLE dbo.idempotency_records ADD hash_version TINYINT NULL;
GO

-- Historical records cannot recover their raw client key. Mark, but do not
-- pretend, that the legacy primary-key digest is the new domain-separated
-- client-key digest. Deployment fails closed until any live replay window ends.
UPDATE dbo.idempotency_records
SET client_key_hash = idempotency_key
WHERE client_key_hash IS NULL;

UPDATE dbo.idempotency_records
SET hash_version = CASE WHEN client_key_hash = idempotency_key THEN 1 ELSE 2 END
WHERE hash_version IS NULL;

IF EXISTS (SELECT 1 FROM dbo.idempotency_records WHERE client_key_hash IS NULL)
    THROW 51005, 'Idempotency client-key backfill is incomplete.', 1;

DECLARE @vietnam_now DATETIME2(7) = CAST(
    SYSDATETIMEOFFSET() AT TIME ZONE 'SE Asia Standard Time' AS DATETIME2(7)
);

IF EXISTS (
    SELECT 1 FROM dbo.idempotency_records
    WHERE hash_version = 1 AND expires_at > @vietnam_now
)
    THROW 51018, 'Unexpired legacy idempotency records must age out before Phase 3C.', 1;

IF EXISTS (
    SELECT request_path, principal_scope_hash, client_key_hash
    FROM dbo.idempotency_records
    GROUP BY request_path, principal_scope_hash, client_key_hash
    HAVING COUNT(*) > 1
)
    THROW 51006, 'Duplicate actor/client idempotency keys must be repaired before Phase 3C.', 1;

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.idempotency_records')
      AND name = 'client_key_hash' AND is_nullable = 1
)
    ALTER TABLE dbo.idempotency_records ALTER COLUMN client_key_hash CHAR(64) NOT NULL;

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.idempotency_records')
      AND name = 'hash_version' AND is_nullable = 1
)
    ALTER TABLE dbo.idempotency_records ALTER COLUMN hash_version TINYINT NOT NULL;

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.idempotency_records')
      AND name = 'response_location' AND is_nullable = 0
)
    ALTER TABLE dbo.idempotency_records ALTER COLUMN response_location VARCHAR(200) NULL;

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.idempotency_records')
      AND name = 'response_cache_control' AND is_nullable = 0
)
    ALTER TABLE dbo.idempotency_records ALTER COLUMN response_cache_control VARCHAR(100) NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.default_constraints default_constraint
    JOIN sys.columns column_metadata
      ON column_metadata.object_id = default_constraint.parent_object_id
     AND column_metadata.column_id = default_constraint.parent_column_id
    WHERE default_constraint.parent_object_id = OBJECT_ID('dbo.idempotency_records')
      AND column_metadata.name = 'hash_version'
)
    ALTER TABLE dbo.idempotency_records ADD CONSTRAINT DF_idempotency_hash_version
        DEFAULT (2) FOR hash_version;

-- Upgrade an unambiguous historical LOCKED voucher if one exists.
IF EXISTS (
    SELECT voucher.voucher_id
    FROM dbo.vouchers voucher
    LEFT JOIN dbo.bookings booking
      ON booking.applied_voucher_id = voucher.voucher_id
     AND (
         booking.status IN (
             'PENDING', 'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN',
             'IN_PROGRESS', 'AWAITING_CONFIRM', 'DISPUTED', 'CHANGE_REQUESTED'
         )
     )
    WHERE voucher.status = 'LOCKED' AND voucher.locked_booking_id IS NULL
    GROUP BY voucher.voucher_id
    HAVING COUNT(booking.booking_id) <> 1
)
    THROW 51007, 'A LOCKED voucher does not have exactly one qualifying booking owner.', 1;

UPDATE voucher
SET locked_booking_id = candidate.booking_id
FROM dbo.vouchers voucher
JOIN (
    SELECT booking.applied_voucher_id AS voucher_id, MIN(booking.booking_id) AS booking_id
    FROM dbo.bookings booking
    WHERE booking.status IN (
        'PENDING', 'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN',
        'IN_PROGRESS', 'AWAITING_CONFIRM', 'DISPUTED', 'CHANGE_REQUESTED'
    )
    GROUP BY booking.applied_voucher_id
    HAVING COUNT(*) = 1
) candidate ON candidate.voucher_id = voucher.voucher_id
WHERE voucher.status = 'LOCKED' AND voucher.locked_booking_id IS NULL;

IF EXISTS (
    SELECT 1 FROM dbo.vouchers
    WHERE (status = 'LOCKED' AND locked_booking_id IS NULL)
       OR (status <> 'LOCKED' AND locked_booking_id IS NOT NULL)
)
    THROW 51008, 'Voucher lock ownership data must be repaired before Phase 3C.', 1;

IF COL_LENGTH('dbo.bookings', 'active_customer_guard') IS NULL
    ALTER TABLE dbo.bookings ADD active_customer_guard AS (
        CASE WHEN customer_id IS NOT NULL AND status IN (
            'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'AWAITING_CONFIRM'
        ) THEN customer_id ELSE -booking_id END
    ) PERSISTED;

IF COL_LENGTH('dbo.bookings', 'active_guest_guard') IS NULL
    ALTER TABLE dbo.bookings ADD active_guest_guard AS (
        CASE WHEN guest_id IS NOT NULL AND status IN (
            'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'AWAITING_CONFIRM'
        ) THEN guest_id ELSE -booking_id END
    ) PERSISTED;
GO

IF EXISTS (
    SELECT customer_id
    FROM dbo.bookings
    WHERE customer_id IS NOT NULL
      AND status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'AWAITING_CONFIRM')
    GROUP BY customer_id
    HAVING COUNT(*) > 1
)
    THROW 51009, 'Duplicate active customer bookings must be repaired before Phase 3C.', 1;

IF EXISTS (
    SELECT guest_id
    FROM dbo.bookings
    WHERE guest_id IS NOT NULL
      AND status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'AWAITING_CONFIRM')
    GROUP BY guest_id
    HAVING COUNT(*) > 1
)
    THROW 51010, 'Duplicate active guest bookings must be repaired before Phase 3C.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.bookings
    WHERE booking_id <= 0
       OR (customer_id IS NOT NULL AND customer_id <= 0)
       OR (guest_id IS NOT NULL AND guest_id <= 0)
)
    THROW 51011, 'Booking and actor identifiers must be positive before guard indexes are created.', 1;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_bookings_active_customer'
      AND object_id = OBJECT_ID('dbo.bookings')
)
    CREATE UNIQUE INDEX UX_bookings_active_customer
        ON dbo.bookings(active_customer_guard);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_bookings_active_guest'
      AND object_id = OBJECT_ID('dbo.bookings')
)
    CREATE UNIQUE INDEX UX_bookings_active_guest
        ON dbo.bookings(active_guest_guard);

ALTER INDEX UX_bookings_active_customer ON dbo.bookings REBUILD;
ALTER INDEX UX_bookings_active_guest ON dbo.bookings REBUILD;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.bookings')
      AND name IN ('UX_bookings_active_customer', 'UX_bookings_active_guest')
      AND (is_unique = 0 OR is_disabled = 1 OR filter_definition IS NOT NULL)
)
    THROW 51012, 'Active-owner indexes do not have the required unique unfiltered shape.', 1;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_bookings_guard_ids'
      AND parent_object_id = OBJECT_ID('dbo.bookings')
)
    ALTER TABLE dbo.bookings WITH CHECK ADD CONSTRAINT CK_bookings_guard_ids CHECK (
        booking_id > 0
        AND (customer_id IS NULL OR customer_id > 0)
        AND (guest_id IS NULL OR guest_id > 0)
    );

ALTER TABLE dbo.bookings WITH CHECK CHECK CONSTRAINT CK_bookings_guard_ids;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_bookings_status_v2'
      AND parent_object_id = OBJECT_ID('dbo.bookings')
)
    ALTER TABLE dbo.bookings WITH CHECK ADD CONSTRAINT CK_bookings_status_v2 CHECK (
        status IS NOT NULL
        AND status IN (
            'PENDING', 'PENDING_DEPOSIT', 'CONFIRMED', 'CHECKED_IN',
            'IN_PROGRESS', 'AWAITING_CONFIRM', 'COMPLETED', 'DISPUTED',
            'CHANGE_REQUESTED', 'CANCELLED', 'EXPIRED', 'NO_SHOW'
        )
        AND (status <> 'PENDING' OR legacy_financial_snapshot = 1)
    );

ALTER TABLE dbo.bookings WITH CHECK CHECK CONSTRAINT CK_bookings_status_v2;

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_bookings_pending_expiry'
      AND parent_object_id = OBJECT_ID('dbo.bookings')
)
    ALTER TABLE dbo.bookings DROP CONSTRAINT CK_bookings_pending_expiry;

ALTER TABLE dbo.bookings WITH CHECK ADD CONSTRAINT CK_bookings_pending_expiry CHECK (
    legacy_financial_snapshot = 1
    OR (
        created_at IS NOT NULL
        AND (
            (
                status = 'PENDING_DEPOSIT'
                AND deposit_amount > 0
                AND deposit_expires_at IS NOT NULL
                AND deposit_expires_at > created_at
            )
            OR (status <> 'PENDING_DEPOSIT' AND deposit_expires_at IS NULL)
        )
    )
);

ALTER TABLE dbo.bookings WITH CHECK CHECK CONSTRAINT CK_bookings_pending_expiry;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_bookings_assignment'
      AND parent_object_id = OBJECT_ID('dbo.bookings')
)
    ALTER TABLE dbo.bookings WITH CHECK ADD CONSTRAINT CK_bookings_assignment CHECK (
        legacy_financial_snapshot = 1
        OR (booking_mode = 'SLOT' AND assigned_bay_id IS NOT NULL)
        OR (booking_mode = 'FLEXIBLE' AND assigned_bay_id IS NULL)
    );

ALTER TABLE dbo.bookings WITH CHECK CHECK CONSTRAINT CK_bookings_assignment;

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_bookings_assignment')
    ALTER TABLE dbo.bookings ADD CONSTRAINT UQ_bookings_assignment
        UNIQUE (booking_id, branch_id, assigned_bay_id);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_bookings_voucher_lock')
    ALTER TABLE dbo.bookings ADD CONSTRAINT UQ_bookings_voucher_lock
        UNIQUE (booking_id, applied_voucher_id);

IF (
    SELECT COUNT(*)
    FROM sys.key_constraints key_constraint
    JOIN sys.index_columns index_column
      ON index_column.object_id = key_constraint.parent_object_id
     AND index_column.index_id = key_constraint.unique_index_id
    JOIN sys.columns column_metadata
      ON column_metadata.object_id = index_column.object_id
     AND column_metadata.column_id = index_column.column_id
    WHERE key_constraint.parent_object_id = OBJECT_ID('dbo.bookings')
      AND key_constraint.name = 'UQ_bookings_voucher_lock'
      AND (
          (index_column.key_ordinal = 1 AND column_metadata.name = 'booking_id')
          OR (index_column.key_ordinal = 2 AND column_metadata.name = 'applied_voucher_id')
      )
) <> 2
    THROW 51013, 'UQ_bookings_voucher_lock does not have the required key shape.', 1;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_bookings_assigned_bay_branch')
    ALTER TABLE dbo.bookings WITH CHECK ADD CONSTRAINT FK_bookings_assigned_bay_branch
        FOREIGN KEY (assigned_bay_id, branch_id)
        REFERENCES dbo.bays(bay_id, branch_id);

ALTER TABLE dbo.bookings WITH CHECK CHECK CONSTRAINT FK_bookings_assigned_bay_branch;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_slot_reservations_booking_assignment')
    ALTER TABLE dbo.slot_reservations WITH CHECK
        ADD CONSTRAINT FK_slot_reservations_booking_assignment
        FOREIGN KEY (booking_id, branch_id, bay_id)
        REFERENCES dbo.bookings(booking_id, branch_id, assigned_bay_id);

ALTER TABLE dbo.slot_reservations WITH CHECK CHECK CONSTRAINT FK_slot_reservations_booking_assignment;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_booking_items_booking_service'
      AND object_id = OBJECT_ID('dbo.booking_items')
)
    CREATE UNIQUE INDEX UX_booking_items_booking_service
        ON dbo.booking_items(booking_id, service_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_idempotency_actor_key'
      AND object_id = OBJECT_ID('dbo.idempotency_records')
)
    CREATE UNIQUE INDEX UX_idempotency_actor_key
        ON dbo.idempotency_records(request_path, principal_scope_hash, client_key_hash);

IF EXISTS (
    SELECT guest_proof_hash FROM dbo.idempotency_records
    WHERE guest_proof_hash IS NOT NULL
    GROUP BY guest_proof_hash HAVING COUNT(*) > 1
)
    THROW 51014, 'A guest proof is associated with more than one idempotency result.', 1;

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_idempotency_guest_replay'
      AND object_id = OBJECT_ID('dbo.idempotency_records')
)
    DROP INDEX IX_idempotency_guest_replay ON dbo.idempotency_records;

CREATE UNIQUE INDEX IX_idempotency_guest_replay
    ON dbo.idempotency_records(guest_proof_hash)
    INCLUDE (client_key_hash, request_path, idempotency_key, expires_at)
    WHERE guest_proof_hash IS NOT NULL;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_idempotency_expiry'
      AND object_id = OBJECT_ID('dbo.idempotency_records')
)
    CREATE INDEX IX_idempotency_expiry
        ON dbo.idempotency_records(expires_at, idempotency_key);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_bookings_expiry_claim'
      AND object_id = OBJECT_ID('dbo.bookings')
)
    CREATE INDEX IX_bookings_expiry_claim
        ON dbo.bookings(status, deposit_expires_at, booking_id)
        INCLUDE(applied_voucher_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_slot_booking_lock'
      AND object_id = OBJECT_ID('dbo.slot_reservations')
)
    CREATE INDEX IX_slot_booking_lock
        ON dbo.slot_reservations(booking_id, slot_time, reservation_id)
        INCLUDE(status, expires_at, bay_id, branch_id);

IF OBJECT_ID('dbo.idempotency_guest_proofs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.idempotency_guest_proofs (
        proof_hash CHAR(64) NOT NULL,
        idempotency_key VARCHAR(100) NOT NULL,
        created_at DATETIME2 NOT NULL,
        CONSTRAINT PK_idempotency_guest_proofs PRIMARY KEY (proof_hash),
        CONSTRAINT FK_idempotency_guest_proofs_record
            FOREIGN KEY (idempotency_key)
            REFERENCES dbo.idempotency_records(idempotency_key)
            ON DELETE CASCADE,
        CONSTRAINT CK_idempotency_guest_proof_hash CHECK (
            LEN(proof_hash) = 64
            AND TRY_CONVERT(VARBINARY(32), proof_hash, 2) IS NOT NULL
        )
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_idempotency_guest_proofs_record'
      AND object_id = OBJECT_ID('dbo.idempotency_guest_proofs')
)
    CREATE INDEX IX_idempotency_guest_proofs_record
        ON dbo.idempotency_guest_proofs(idempotency_key, created_at);

INSERT dbo.idempotency_guest_proofs(proof_hash, idempotency_key, created_at)
SELECT record.guest_proof_hash, record.idempotency_key, record.created_at
FROM dbo.idempotency_records record
WHERE record.guest_proof_hash IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM dbo.idempotency_guest_proofs proof
      WHERE proof.proof_hash = record.guest_proof_hash
  );

ALTER TABLE dbo.idempotency_guest_proofs WITH CHECK CHECK CONSTRAINT
    FK_idempotency_guest_proofs_record;
ALTER TABLE dbo.idempotency_guest_proofs WITH CHECK CHECK CONSTRAINT
    CK_idempotency_guest_proof_hash;

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_booking_items_v2'
      AND parent_object_id = OBJECT_ID('dbo.booking_items')
)
    ALTER TABLE dbo.booking_items DROP CONSTRAINT CK_booking_items_v2;

ALTER TABLE dbo.booking_items WITH CHECK ADD CONSTRAINT CK_booking_items_v2 CHECK (
    quantity BETWEEN 1 AND 20
    AND unit_price > 0 AND unit_price = ROUND(unit_price, 0)
    AND size_multiplier IN (0.90, 1.00, 1.20, 1.40)
    AND line_total > 0 AND line_total = ROUND(line_total, 0)
    AND duration_minutes > 0
    AND buffer_minutes >= 0
);

ALTER TABLE dbo.booking_items WITH CHECK CHECK CONSTRAINT CK_booking_items_v2;

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys foreign_key
    WHERE foreign_key.parent_object_id = OBJECT_ID('dbo.vouchers')
      AND foreign_key.name = 'FK_vouchers_locked_booking'
      AND 2 <> (
          SELECT COUNT(*)
          FROM sys.foreign_key_columns foreign_key_column
          JOIN sys.columns parent_column
            ON parent_column.object_id = foreign_key.parent_object_id
           AND parent_column.column_id = foreign_key_column.parent_column_id
          JOIN sys.columns referenced_column
            ON referenced_column.object_id = foreign_key.referenced_object_id
           AND referenced_column.column_id = foreign_key_column.referenced_column_id
          WHERE foreign_key_column.constraint_object_id = foreign_key.object_id
            AND (
                (foreign_key_column.constraint_column_id = 1
                 AND parent_column.name = 'locked_booking_id'
                 AND referenced_column.name = 'booking_id')
                OR (foreign_key_column.constraint_column_id = 2
                    AND parent_column.name = 'voucher_id'
                    AND referenced_column.name = 'applied_voucher_id')
            )
      )
)
    ALTER TABLE dbo.vouchers DROP CONSTRAINT FK_vouchers_locked_booking;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_vouchers_locked_booking')
    ALTER TABLE dbo.vouchers WITH CHECK ADD CONSTRAINT FK_vouchers_locked_booking
        FOREIGN KEY (locked_booking_id, voucher_id)
        REFERENCES dbo.bookings(booking_id, applied_voucher_id);

ALTER TABLE dbo.vouchers WITH CHECK CHECK CONSTRAINT FK_vouchers_locked_booking;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_vouchers_lock_state'
      AND parent_object_id = OBJECT_ID('dbo.vouchers')
)
    ALTER TABLE dbo.vouchers WITH CHECK ADD CONSTRAINT CK_vouchers_lock_state CHECK (
        status IS NOT NULL
        AND status IN ('ACTIVE', 'LOCKED', 'USED')
        AND (
            (status = 'LOCKED' AND locked_booking_id IS NOT NULL)
            OR (status <> 'LOCKED' AND locked_booking_id IS NULL)
        )
    );

ALTER TABLE dbo.vouchers WITH CHECK CHECK CONSTRAINT CK_vouchers_lock_state;

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_idempotency_actor'
      AND parent_object_id = OBJECT_ID('dbo.idempotency_records')
)
    ALTER TABLE dbo.idempotency_records DROP CONSTRAINT CK_idempotency_actor;

ALTER TABLE dbo.idempotency_records WITH CHECK ADD CONSTRAINT CK_idempotency_actor CHECK (
    (customer_id IS NOT NULL AND guest_phone IS NULL AND guest_proof_hash IS NULL)
    OR (
        customer_id IS NULL
        AND guest_phone IS NOT NULL
        AND LEN(guest_phone) > 0
        AND guest_proof_hash IS NOT NULL
    )
);

ALTER TABLE dbo.idempotency_records WITH CHECK CHECK CONSTRAINT CK_idempotency_actor;

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_idempotency_hashes'
      AND parent_object_id = OBJECT_ID('dbo.idempotency_records')
)
    ALTER TABLE dbo.idempotency_records DROP CONSTRAINT CK_idempotency_hashes;

ALTER TABLE dbo.idempotency_records WITH CHECK ADD CONSTRAINT CK_idempotency_hashes CHECK (
    LEN(request_hash) = 64
    AND TRY_CONVERT(VARBINARY(32), request_hash, 2) IS NOT NULL
    AND LEN(principal_scope_hash) = 64
    AND TRY_CONVERT(VARBINARY(32), principal_scope_hash, 2) IS NOT NULL
    AND LEN(client_key_hash) = 64
    AND TRY_CONVERT(VARBINARY(32), client_key_hash, 2) IS NOT NULL
    AND (guest_proof_hash IS NULL OR (
        LEN(guest_proof_hash) = 64
        AND TRY_CONVERT(VARBINARY(32), guest_proof_hash, 2) IS NOT NULL
    ))
);

ALTER TABLE dbo.idempotency_records WITH CHECK CHECK CONSTRAINT CK_idempotency_hashes;

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_idempotency_hash_version'
      AND parent_object_id = OBJECT_ID('dbo.idempotency_records')
)
    ALTER TABLE dbo.idempotency_records DROP CONSTRAINT CK_idempotency_hash_version;

ALTER TABLE dbo.idempotency_records WITH CHECK ADD CONSTRAINT CK_idempotency_hash_version CHECK (
    hash_version IN (1, 2)
);

ALTER TABLE dbo.idempotency_records WITH CHECK CHECK CONSTRAINT CK_idempotency_hash_version;

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_idempotency_expiry'
      AND parent_object_id = OBJECT_ID('dbo.idempotency_records')
)
    ALTER TABLE dbo.idempotency_records DROP CONSTRAINT CK_idempotency_expiry;

-- An idempotency cache is safe to shorten. Clamp historical records created by
-- legacy code that used separate clock reads instead of rejecting the upgrade.
UPDATE dbo.idempotency_records
SET expires_at = DATEADD(HOUR, 24, created_at)
WHERE expires_at > DATEADD(HOUR, 24, created_at);

DELETE FROM dbo.idempotency_records
WHERE expires_at <= created_at;

ALTER TABLE dbo.idempotency_records WITH CHECK ADD CONSTRAINT CK_idempotency_expiry CHECK (
    expires_at > created_at
    AND expires_at <= DATEADD(HOUR, 24, created_at)
);

ALTER TABLE dbo.idempotency_records WITH CHECK CHECK CONSTRAINT CK_idempotency_expiry;

COMMIT TRANSACTION;
GO
