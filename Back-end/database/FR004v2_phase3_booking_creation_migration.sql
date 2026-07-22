-- FR-004/FR-005 v2 Phase 3: booking creation, pricing, and 15-minute holds.
-- Additive and idempotent. Run against both autowash_pro and autowash_pro_test.
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

-- Trusted service catalog attributes used for pricing and capacity.
IF COL_LENGTH('dbo.services', 'is_size_dependent') IS NULL
    ALTER TABLE dbo.services ADD is_size_dependent BIT NOT NULL
        CONSTRAINT DF_services_size_dependent DEFAULT (1) WITH VALUES;
IF COL_LENGTH('dbo.services', 'pricing_unit') IS NULL
    ALTER TABLE dbo.services ADD pricing_unit VARCHAR(20) NOT NULL
        CONSTRAINT DF_services_pricing_unit DEFAULT ('PER_CAR') WITH VALUES;
IF COL_LENGTH('dbo.services', 'booking_mode') IS NULL
    ALTER TABLE dbo.services ADD booking_mode VARCHAR(20) NOT NULL
        CONSTRAINT DF_services_booking_mode DEFAULT ('SLOT') WITH VALUES;
IF COL_LENGTH('dbo.services', 'buffer_minutes') IS NULL
    ALTER TABLE dbo.services ADD buffer_minutes INT NOT NULL
        CONSTRAINT DF_services_buffer_minutes DEFAULT (10) WITH VALUES;
IF COL_LENGTH('dbo.services', 'required_bay_type') IS NULL
    ALTER TABLE dbo.services ADD required_bay_type VARCHAR(20) NOT NULL
        CONSTRAINT DF_services_required_bay_type DEFAULT ('QUICK') WITH VALUES;
IF COL_LENGTH('dbo.services', 'booking_configured') IS NULL
    ALTER TABLE dbo.services ADD booking_configured BIT NOT NULL
        CONSTRAINT DF_services_booking_configured DEFAULT (0) WITH VALUES;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_services_pricing_unit')
    ALTER TABLE dbo.services ADD CONSTRAINT CK_services_pricing_unit
        CHECK (pricing_unit IN ('PER_CAR','PER_SEAT','PER_PANEL','PER_TIRE'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_services_booking_mode')
    ALTER TABLE dbo.services ADD CONSTRAINT CK_services_booking_mode
        CHECK (booking_mode IN ('SLOT','FLEXIBLE'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_services_required_bay_type')
    ALTER TABLE dbo.services ADD CONSTRAINT CK_services_required_bay_type
        CHECK (required_bay_type IN ('QUICK','DETAIL','UNIVERSAL'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_services_buffer_minutes')
    ALTER TABLE dbo.services ADD CONSTRAINT CK_services_buffer_minutes
        CHECK (buffer_minutes >= 0 AND buffer_minutes <= 240);

-- Bring the ten legacy codes onto the approved catalog snapshots. Values are
-- server-owned booking inputs, never accepted from a client request.
UPDATE dbo.services SET base_price = 180000, duration_minutes = 20,
    is_size_dependent = 1, pricing_unit = 'PER_CAR', booking_mode = 'SLOT',
    buffer_minutes = 10, required_bay_type = 'QUICK', booking_configured = 1
WHERE service_code = 'wc1';
UPDATE dbo.services SET base_price = 280000, duration_minutes = 20,
    is_size_dependent = 1, pricing_unit = 'PER_CAR', booking_mode = 'SLOT',
    buffer_minutes = 10, required_bay_type = 'QUICK', booking_configured = 1
WHERE service_code = 'wc2';
UPDATE dbo.services SET base_price = 640000, duration_minutes = 40,
    is_size_dependent = 1, pricing_unit = 'PER_CAR', booking_mode = 'SLOT',
    buffer_minutes = 5, required_bay_type = 'QUICK', booking_configured = 1
WHERE service_code = 'wc3';
UPDATE dbo.services SET base_price = 90000, duration_minutes = 20,
    is_size_dependent = 1, pricing_unit = 'PER_CAR', booking_mode = 'SLOT',
    buffer_minutes = 10, required_bay_type = 'QUICK', booking_configured = 1
WHERE service_code = 'wc4';
UPDATE dbo.services SET base_price = 50000, duration_minutes = 20,
    is_size_dependent = 1, pricing_unit = 'PER_CAR', booking_mode = 'SLOT',
    buffer_minutes = 10, required_bay_type = 'QUICK', booking_configured = 1
WHERE service_code = 'wc5';

UPDATE dbo.services SET base_price = 1400000, duration_minutes = 120,
    is_size_dependent = 1, pricing_unit = 'PER_CAR', booking_mode = 'FLEXIBLE',
    buffer_minutes = 15, required_bay_type = 'DETAIL', booking_configured = 1
WHERE service_code = 'ic1';
UPDATE dbo.services SET base_price = 1900000, duration_minutes = 180,
    is_size_dependent = 1, pricing_unit = 'PER_CAR', booking_mode = 'FLEXIBLE',
    buffer_minutes = 15, required_bay_type = 'DETAIL', booking_configured = 1
WHERE service_code = 'ic2';
UPDATE dbo.services SET base_price = 2300000, duration_minutes = 180,
    is_size_dependent = 1, pricing_unit = 'PER_CAR', booking_mode = 'FLEXIBLE',
    buffer_minutes = 15, required_bay_type = 'DETAIL', booking_configured = 1
WHERE service_code = 'ic3';
UPDATE dbo.services SET base_price = 350000, duration_minutes = 60,
    is_size_dependent = 0, pricing_unit = 'PER_SEAT', booking_mode = 'FLEXIBLE',
    buffer_minutes = 15, required_bay_type = 'DETAIL', booking_configured = 1
WHERE service_code = 'ic4';
UPDATE dbo.services SET base_price = 1200000, duration_minutes = 90,
    is_size_dependent = 0, pricing_unit = 'PER_CAR', booking_mode = 'FLEXIBLE',
    buffer_minutes = 15, required_bay_type = 'DETAIL', booking_configured = 1
WHERE service_code = 'ic5';

-- Branch-specific booking and advance-time configuration.
IF COL_LENGTH('dbo.branches', 'booking_enabled') IS NULL
    ALTER TABLE dbo.branches ADD booking_enabled BIT NOT NULL
        CONSTRAINT DF_branches_booking_enabled DEFAULT (1) WITH VALUES;
IF COL_LENGTH('dbo.branches', 'booking_notice') IS NULL
    ALTER TABLE dbo.branches ADD booking_notice NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.branches', 'slot_minutes') IS NULL
    ALTER TABLE dbo.branches ADD slot_minutes INT NOT NULL
        CONSTRAINT DF_branches_slot_minutes DEFAULT (15) WITH VALUES;
IF COL_LENGTH('dbo.branches', 'min_advance_slot_minutes') IS NULL
    ALTER TABLE dbo.branches ADD min_advance_slot_minutes INT NOT NULL
        CONSTRAINT DF_branches_min_advance_slot DEFAULT (90) WITH VALUES;
IF COL_LENGTH('dbo.branches', 'min_advance_flexible_minutes') IS NULL
    ALTER TABLE dbo.branches ADD min_advance_flexible_minutes INT NOT NULL
        CONSTRAINT DF_branches_min_advance_flexible DEFAULT (60) WITH VALUES;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_branches_slot_minutes')
    ALTER TABLE dbo.branches ADD CONSTRAINT CK_branches_slot_minutes CHECK (slot_minutes = 15);
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_branches_advance_minutes')
    ALTER TABLE dbo.branches ADD CONSTRAINT CK_branches_advance_minutes CHECK (
        min_advance_slot_minutes >= 0 AND min_advance_flexible_minutes >= 0
    );

-- Guest vehicle history and deposit lifecycle snapshots.
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'vehicle_id' AND is_nullable = 0
)
    ALTER TABLE dbo.bookings ALTER COLUMN vehicle_id BIGINT NULL;
IF COL_LENGTH('dbo.bookings', 'guest_license_plate') IS NULL
    ALTER TABLE dbo.bookings ADD guest_license_plate VARCHAR(20) NULL;
IF COL_LENGTH('dbo.bookings', 'guest_vehicle_brand') IS NULL
    ALTER TABLE dbo.bookings ADD guest_vehicle_brand NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.bookings', 'guest_vehicle_size') IS NULL
    ALTER TABLE dbo.bookings ADD guest_vehicle_size VARCHAR(20) NULL;
IF COL_LENGTH('dbo.bookings', 'booking_mode') IS NULL
    ALTER TABLE dbo.bookings ADD booking_mode VARCHAR(20) NOT NULL
        CONSTRAINT DF_bookings_booking_mode DEFAULT ('SLOT') WITH VALUES;
IF COL_LENGTH('dbo.bookings', 'subtotal') IS NULL
    ALTER TABLE dbo.bookings ADD subtotal DECIMAL(12,2) NOT NULL
        CONSTRAINT DF_bookings_subtotal DEFAULT (0) WITH VALUES;
IF COL_LENGTH('dbo.bookings', 'size_adjustment') IS NULL
    ALTER TABLE dbo.bookings ADD size_adjustment DECIMAL(12,2) NOT NULL
        CONSTRAINT DF_bookings_size_adjustment DEFAULT (0) WITH VALUES;
IF COL_LENGTH('dbo.bookings', 'voucher_discount') IS NULL
    ALTER TABLE dbo.bookings ADD voucher_discount DECIMAL(12,2) NOT NULL
        CONSTRAINT DF_bookings_voucher_discount DEFAULT (0) WITH VALUES;
IF COL_LENGTH('dbo.bookings', 'deposit_amount') IS NULL
    ALTER TABLE dbo.bookings ADD deposit_amount DECIMAL(12,2) NOT NULL
        CONSTRAINT DF_bookings_deposit_amount DEFAULT (0) WITH VALUES;
IF COL_LENGTH('dbo.bookings', 'paid_amount') IS NULL
    ALTER TABLE dbo.bookings ADD paid_amount DECIMAL(12,2) NOT NULL
        CONSTRAINT DF_bookings_paid_amount DEFAULT (0) WITH VALUES;
IF COL_LENGTH('dbo.bookings', 'counter_balance') IS NULL
    ALTER TABLE dbo.bookings ADD counter_balance DECIMAL(12,2) NOT NULL
        CONSTRAINT DF_bookings_counter_balance DEFAULT (0) WITH VALUES;
IF COL_LENGTH('dbo.bookings', 'deposit_expires_at') IS NULL
    ALTER TABLE dbo.bookings ADD deposit_expires_at DATETIME2 NULL;
IF COL_LENGTH('dbo.bookings', 'note') IS NULL
    ALTER TABLE dbo.bookings ADD note NVARCHAR(500) NULL;
IF COL_LENGTH('dbo.bookings', 'legacy_financial_snapshot') IS NULL
    ALTER TABLE dbo.bookings ADD legacy_financial_snapshot BIT NULL;
IF COL_LENGTH('dbo.guests', 'vehicle_brand') IS NULL
    ALTER TABLE dbo.guests ADD vehicle_brand NVARCHAR(100) NULL;
GO

UPDATE dbo.bookings SET legacy_financial_snapshot = 1
WHERE legacy_financial_snapshot IS NULL;
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.bookings')
      AND name = 'legacy_financial_snapshot' AND is_nullable = 1
)
    ALTER TABLE dbo.bookings ALTER COLUMN legacy_financial_snapshot BIT NOT NULL;
IF NOT EXISTS (
    SELECT 1 FROM sys.default_constraints
    WHERE name = 'DF_bookings_legacy_financial_snapshot'
      AND parent_object_id = OBJECT_ID('dbo.bookings')
)
    ALTER TABLE dbo.bookings ADD CONSTRAINT DF_bookings_legacy_financial_snapshot
        DEFAULT (0) FOR legacy_financial_snapshot;
GO

-- Upgrade historical guest rows from the previous transitional model, which
-- attached a persisted vehicle solely because vehicle_id was then NOT NULL.
UPDATE booking
SET guest_license_plate = COALESCE(booking.guest_license_plate, vehicle.license_plate, guest.license_plate),
    guest_vehicle_brand = COALESCE(booking.guest_vehicle_brand, vehicle.brand, guest.vehicle_brand),
    guest_vehicle_size = COALESCE(booking.guest_vehicle_size, CONVERT(VARCHAR(20), vehicle.vehicle_size),
        CONVERT(VARCHAR(20), guest.vehicle_size))
FROM dbo.bookings booking
LEFT JOIN dbo.vehicles vehicle ON vehicle.vehicle_id = booking.vehicle_id
LEFT JOIN dbo.guests guest ON guest.guest_id = booking.guest_id
WHERE booking.customer_id IS NULL AND booking.guest_id IS NOT NULL;

UPDATE dbo.bookings
SET vehicle_id = NULL
WHERE customer_id IS NULL AND guest_id IS NOT NULL
  AND guest_license_plate IS NOT NULL
  AND guest_vehicle_brand IS NOT NULL
  AND guest_vehicle_size IS NOT NULL;

-- Preserve legacy totals as a consistent price snapshot before strengthening
-- the arithmetic constraint. Phase 3 creation writes all fields explicitly.
UPDATE dbo.bookings
SET subtotal = COALESCE(total_price, 0),
    size_adjustment = 0,
    voucher_discount = 0,
    counter_balance = COALESCE(total_price, 0)
WHERE subtotal = 0 AND size_adjustment = 0 AND voucher_discount = 0
  AND deposit_amount = 0 AND counter_balance = 0
  AND COALESCE(total_price, 0) > 0;

-- Recreate the named constraint so rerunning this still upgrades the narrower
-- Phase 3 draft that was exercised locally before these snapshot columns existed.
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_bookings_payment_amounts'
      AND parent_object_id = OBJECT_ID('dbo.bookings')
)
    ALTER TABLE dbo.bookings DROP CONSTRAINT CK_bookings_payment_amounts;
ALTER TABLE dbo.bookings WITH CHECK ADD CONSTRAINT CK_bookings_payment_amounts
    CHECK (subtotal >= 0 AND subtotal + size_adjustment >= 0
        AND voucher_discount >= 0
        AND voucher_discount <= subtotal + size_adjustment
        AND deposit_amount >= 0 AND paid_amount >= 0 AND counter_balance >= 0
        AND (total_price IS NULL OR (
            total_price = subtotal + size_adjustment - voucher_discount
            AND deposit_amount <= total_price
            AND paid_amount <= total_price
            AND counter_balance = total_price - deposit_amount
        )));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_bookings_mode'
    AND parent_object_id = OBJECT_ID('dbo.bookings'))
    ALTER TABLE dbo.bookings ADD CONSTRAINT CK_bookings_mode
        CHECK (booking_mode IN ('SLOT','FLEXIBLE'));
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_bookings_guest_vehicle_size'
    AND parent_object_id = OBJECT_ID('dbo.bookings'))
    ALTER TABLE dbo.bookings ADD CONSTRAINT CK_bookings_guest_vehicle_size
        CHECK (guest_vehicle_size IS NULL OR guest_vehicle_size IN ('HATCHBACK','SEDAN','SUV','PICKUP'));
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_bookings_vehicle_by_actor'
    AND parent_object_id = OBJECT_ID('dbo.bookings'))
    ALTER TABLE dbo.bookings DROP CONSTRAINT CK_bookings_vehicle_by_actor;
ALTER TABLE dbo.bookings WITH CHECK ADD CONSTRAINT CK_bookings_vehicle_by_actor CHECK (
    (customer_id IS NOT NULL AND guest_id IS NULL AND vehicle_id IS NOT NULL)
    OR
    (customer_id IS NULL AND guest_id IS NOT NULL AND vehicle_id IS NULL
        AND guest_license_plate IS NOT NULL AND guest_vehicle_brand IS NOT NULL
        AND guest_vehicle_size IS NOT NULL)
);

-- Tier policy is data-driven for deposit, booking windows, and point multipliers.
IF OBJECT_ID('dbo.tiers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tiers (
        tier_id              BIGINT IDENTITY(1,1) NOT NULL,
        tier_code            VARCHAR(20) NOT NULL,
        tier_rank            INT NOT NULL,
        booking_window_days  INT NOT NULL,
        points_multiplier    DECIMAL(4,2) NOT NULL,
        deposit_waived       BIT NOT NULL,
        created_at           DATETIME2 NOT NULL CONSTRAINT DF_tiers_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT PK_tiers PRIMARY KEY (tier_id),
        CONSTRAINT UX_tiers_code UNIQUE (tier_code),
        CONSTRAINT UX_tiers_rank UNIQUE (tier_rank),
        CONSTRAINT CK_tiers_code CHECK (tier_code IN ('MEMBER','SILVER','GOLD','PLATINUM')),
        CONSTRAINT CK_tiers_policy CHECK (
            tier_rank BETWEEN 1 AND 4 AND booking_window_days BETWEEN 1 AND 60
            AND points_multiplier >= 1.00 AND points_multiplier <= 5.00
        )
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.tiers WHERE tier_code = 'MEMBER')
    INSERT dbo.tiers(tier_code,tier_rank,booking_window_days,points_multiplier,deposit_waived)
    VALUES ('MEMBER',1,7,1.00,0);
IF NOT EXISTS (SELECT 1 FROM dbo.tiers WHERE tier_code = 'SILVER')
    INSERT dbo.tiers(tier_code,tier_rank,booking_window_days,points_multiplier,deposit_waived)
    VALUES ('SILVER',2,10,1.10,0);
IF NOT EXISTS (SELECT 1 FROM dbo.tiers WHERE tier_code = 'GOLD')
    INSERT dbo.tiers(tier_code,tier_rank,booking_window_days,points_multiplier,deposit_waived)
    VALUES ('GOLD',3,12,1.20,1);
IF NOT EXISTS (SELECT 1 FROM dbo.tiers WHERE tier_code = 'PLATINUM')
    INSERT dbo.tiers(tier_code,tier_rank,booking_window_days,points_multiplier,deposit_waived)
    VALUES ('PLATINUM',4,14,1.30,1);

-- No-show policy and transitional tier eligibility for the current string-tier model.
IF COL_LENGTH('dbo.customers', 'no_show_count') IS NULL
    ALTER TABLE dbo.customers ADD no_show_count INT NOT NULL
        CONSTRAINT DF_customers_no_show_count DEFAULT (0) WITH VALUES;
IF COL_LENGTH('dbo.customers', 'requires_full_prepay') IS NULL
    ALTER TABLE dbo.customers ADD requires_full_prepay BIT NOT NULL
        CONSTRAINT DF_customers_full_prepay DEFAULT (0) WITH VALUES;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_customers_no_show_count')
    ALTER TABLE dbo.customers ADD CONSTRAINT CK_customers_no_show_count CHECK (no_show_count >= 0);

IF COL_LENGTH('dbo.vouchers', 'min_tier') IS NULL
    ALTER TABLE dbo.vouchers ADD min_tier VARCHAR(20) NULL;
IF COL_LENGTH('dbo.vouchers', 'min_tier_id') IS NULL
    ALTER TABLE dbo.vouchers ADD min_tier_id BIGINT NULL;
IF COL_LENGTH('dbo.guests', 'vehicle_brand') IS NULL
    ALTER TABLE dbo.guests ADD vehicle_brand NVARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_vouchers_min_tier')
    ALTER TABLE dbo.vouchers ADD CONSTRAINT CK_vouchers_min_tier
        CHECK (min_tier IS NULL OR min_tier IN ('MEMBER','SILVER','GOLD','PLATINUM'));
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_vouchers_min_tier')
    ALTER TABLE dbo.vouchers ADD CONSTRAINT FK_vouchers_min_tier
        FOREIGN KEY (min_tier_id) REFERENCES dbo.tiers(tier_id);

UPDATE voucher
SET min_tier_id = tier.tier_id
FROM dbo.vouchers voucher
JOIN dbo.tiers tier ON tier.tier_code = voucher.min_tier
WHERE voucher.min_tier_id IS NULL AND voucher.min_tier IS NOT NULL;

-- min_tier_id is authoritative; clear the transitional string once migrated
-- so the database cannot retain contradictory eligibility values.
UPDATE dbo.vouchers SET min_tier = NULL WHERE min_tier_id IS NOT NULL;

-- The primary key stores a server-derived scoped digest, never the raw key.
IF COL_LENGTH('dbo.idempotency_records', 'request_hash') IS NULL
    ALTER TABLE dbo.idempotency_records ADD request_hash CHAR(64) NULL;
IF COL_LENGTH('dbo.idempotency_records', 'principal_scope_hash') IS NULL
    ALTER TABLE dbo.idempotency_records ADD principal_scope_hash CHAR(64) NULL;
GO

-- Convert legacy raw keys once. A 64-character hexadecimal value is already a
-- SHA-256 storage key and remains stable on idempotent reruns.
UPDATE dbo.idempotency_records
SET idempotency_key = LOWER(CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', idempotency_key), 2))
WHERE LEN(idempotency_key) <> 64
   OR TRY_CONVERT(VARBINARY(32), idempotency_key, 2) IS NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_idempotency_records_key_digest'
      AND parent_object_id = OBJECT_ID('dbo.idempotency_records')
)
    ALTER TABLE dbo.idempotency_records WITH CHECK ADD CONSTRAINT CK_idempotency_records_key_digest
        CHECK (LEN(idempotency_key) = 64
            AND TRY_CONVERT(VARBINARY(32), idempotency_key, 2) IS NOT NULL);
GO

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.idempotency_records')
      AND name = 'request_hash' AND is_nullable = 1
)
BEGIN
    UPDATE dbo.idempotency_records
    SET request_hash = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', idempotency_key), 2)
    WHERE request_hash IS NULL;
    ALTER TABLE dbo.idempotency_records ALTER COLUMN request_hash CHAR(64) NOT NULL;
END;

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.idempotency_records')
      AND name = 'principal_scope_hash' AND is_nullable = 1
)
BEGIN
    UPDATE dbo.idempotency_records
    SET principal_scope_hash = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256',
        COALESCE(CONVERT(VARCHAR(30), customer_id), guest_phone, 'legacy')), 2)
    WHERE principal_scope_hash IS NULL;
    ALTER TABLE dbo.idempotency_records ALTER COLUMN principal_scope_hash CHAR(64) NOT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_bays_id_branch')
    ALTER TABLE dbo.bays ADD CONSTRAINT UQ_bays_id_branch UNIQUE (bay_id, branch_id);
IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'UQ_vehicles_id_customer')
    ALTER TABLE dbo.vehicles ADD CONSTRAINT UQ_vehicles_id_customer UNIQUE (vehicle_id, customer_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_slot_reservations_bay_branch')
    ALTER TABLE dbo.slot_reservations ADD CONSTRAINT FK_slot_reservations_bay_branch
        FOREIGN KEY (bay_id, branch_id) REFERENCES dbo.bays(bay_id, branch_id);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_bookings_vehicle_owner')
    ALTER TABLE dbo.bookings ADD CONSTRAINT FK_bookings_vehicle_owner
        FOREIGN KEY (vehicle_id, customer_id) REFERENCES dbo.vehicles(vehicle_id, customer_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_bookings_pending_expiry' AND object_id = OBJECT_ID('dbo.bookings')
)
    CREATE INDEX IX_bookings_pending_expiry
        ON dbo.bookings(status, deposit_expires_at) INCLUDE (booking_id, applied_voucher_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_bookings_guest_status' AND object_id = OBJECT_ID('dbo.bookings')
)
    CREATE INDEX IX_bookings_guest_status ON dbo.bookings(guest_id, status);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_slot_lookup' AND object_id = OBJECT_ID('dbo.slot_reservations')
)
    CREATE INDEX IX_slot_lookup
        ON dbo.slot_reservations(branch_id, slot_time, status)
        INCLUDE (bay_id, expires_at, booking_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_slot_expiry' AND object_id = OBJECT_ID('dbo.slot_reservations')
)
    CREATE INDEX IX_slot_expiry
        ON dbo.slot_reservations(status, expires_at)
        INCLUDE (booking_id, bay_id, slot_time);

COMMIT TRANSACTION;
GO
