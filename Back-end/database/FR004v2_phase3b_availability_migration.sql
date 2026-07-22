-- FR-004 v2 Phase 3B: active bays and hard slot invariants.
-- Additive and idempotent. Run against both autowash_pro and autowash_pro_test.
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

IF COL_LENGTH('dbo.bays', 'is_active') IS NULL
    ALTER TABLE dbo.bays ADD is_active BIT NOT NULL
        CONSTRAINT DF_bays_is_active DEFAULT (1) WITH VALUES;
GO

INSERT dbo.bays(branch_id, bay_code, bay_type, is_active, created_at)
SELECT branch.branch_id, defaults.bay_code, defaults.bay_type, 1, SYSDATETIME()
FROM dbo.branches branch
CROSS JOIN (VALUES
    ('Q1', 'QUICK'),
    ('Q2', 'QUICK'),
    ('D1', 'DETAIL'),
    ('U1', 'UNIVERSAL')
) defaults(bay_code, bay_type)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.bays existing
    WHERE existing.branch_id = branch.branch_id
      AND existing.bay_code = defaults.bay_code
);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_bays_allocation' AND object_id = OBJECT_ID('dbo.bays')
)
    CREATE INDEX IX_bays_allocation
        ON dbo.bays(branch_id, is_active, bay_type, bay_code) INCLUDE (bay_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_bookings_legacy_availability' AND object_id = OBJECT_ID('dbo.bookings')
)
    CREATE INDEX IX_bookings_legacy_availability
        ON dbo.bookings(branch_id, booking_date, status)
        INCLUDE (booking_id, booking_time, end_time, duration_minutes);

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_slot_reservations_grid')
    ALTER TABLE dbo.slot_reservations ADD CONSTRAINT CK_slot_reservations_grid CHECK (
        DATEPART(MINUTE, slot_time) % 15 = 0
        AND DATEPART(SECOND, slot_time) = 0
        AND DATEPART(NANOSECOND, slot_time) = 0
    );

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_slot_reservations_expiry')
    ALTER TABLE dbo.slot_reservations ADD CONSTRAINT CK_slot_reservations_expiry CHECK (
        (status = 'HOLD' AND expires_at IS NOT NULL)
        OR (status = 'BOOKED' AND expires_at IS NULL)
    );

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_bookings_id_branch')
    ALTER TABLE dbo.bookings ADD CONSTRAINT UQ_bookings_id_branch
        UNIQUE (booking_id, branch_id);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_slot_reservations_booking_branch')
    ALTER TABLE dbo.slot_reservations ADD CONSTRAINT FK_slot_reservations_booking_branch
        FOREIGN KEY (booking_id, branch_id)
        REFERENCES dbo.bookings(booking_id, branch_id);

COMMIT TRANSACTION;
GO
