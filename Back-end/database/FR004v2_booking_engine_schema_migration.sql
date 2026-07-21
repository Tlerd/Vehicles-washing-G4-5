-- FR004v2 booking engine schema migration.
-- Additive and idempotent — safe to run repeatedly against autowash_pro or autowash_pro_test.
USE [autowash_pro]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 1. guests — separate table for unauthenticated bookers (BR-032). Never merged into customers;
--    UX_guests_phone is mandatory so a repeated guest phone cannot create duplicate rows.
IF OBJECT_ID('dbo.guests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.guests (
        guest_id           BIGINT IDENTITY(1,1) NOT NULL,
        full_name          NVARCHAR(100) NOT NULL,
        phone              VARCHAR(20) NOT NULL,
        email              NVARCHAR(150) NULL,
        license_plate      VARCHAR(20) NULL,
        vehicle_size       VARCHAR(20) NULL,
        merged_customer_id BIGINT NULL,
        merged_at          DATETIME2 NULL,
        created_at         DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_guests PRIMARY KEY CLUSTERED (guest_id),
        CONSTRAINT UX_guests_phone UNIQUE (phone),
        CONSTRAINT FK_guests_merged_customer FOREIGN KEY (merged_customer_id) REFERENCES dbo.customers(customer_id)
    );
END
GO

-- 2. bays — 4 physical wash bays per branch (BR-029): 2 QUICK, 1 DETAIL, 1 UNIVERSAL.
IF OBJECT_ID('dbo.bays', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.bays (
        bay_id     BIGINT IDENTITY(1,1) NOT NULL,
        branch_id  BIGINT NOT NULL,
        bay_code   VARCHAR(20) NOT NULL,
        bay_type   VARCHAR(20) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_bays PRIMARY KEY CLUSTERED (bay_id),
        CONSTRAINT UX_bays_branch_code UNIQUE (branch_id, bay_code),
        CONSTRAINT FK_bays_branch FOREIGN KEY (branch_id) REFERENCES dbo.branches(branch_id),
        CONSTRAINT CK_bays_type CHECK (bay_type IN ('QUICK','DETAIL','UNIVERSAL'))
    );
END
GO

-- 3. slot_reservations — the double-booking-proof backbone (BR-030). UX_bay_slot is the
--    single source of concurrency correctness; no app-level locking is required around it.
IF OBJECT_ID('dbo.slot_reservations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.slot_reservations (
        reservation_id BIGINT IDENTITY(1,1) NOT NULL,
        branch_id      BIGINT NOT NULL,
        bay_id         BIGINT NOT NULL,
        slot_time      DATETIME2 NOT NULL,
        booking_id     BIGINT NOT NULL,
        status         VARCHAR(10) NOT NULL,
        expires_at     DATETIME2 NULL,
        CONSTRAINT PK_slot_reservations PRIMARY KEY CLUSTERED (reservation_id),
        CONSTRAINT UX_bay_slot UNIQUE (bay_id, slot_time),
        CONSTRAINT CK_slot_reservations_status CHECK (status IN ('HOLD','BOOKED')),
        CONSTRAINT FK_slot_reservations_branch FOREIGN KEY (branch_id) REFERENCES dbo.branches(branch_id),
        CONSTRAINT FK_slot_reservations_bay FOREIGN KEY (bay_id) REFERENCES dbo.bays(bay_id),
        CONSTRAINT FK_slot_reservations_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(booking_id)
    );
END
GO

-- 4. booking_items — priced/sized/duration snapshot per line item at booking time (BR-026).
--    Additive: the pre-existing booking_services junction table is left untouched.
IF OBJECT_ID('dbo.booking_items', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.booking_items (
        booking_item_id  BIGINT IDENTITY(1,1) NOT NULL,
        booking_id       BIGINT NOT NULL,
        service_id       BIGINT NOT NULL,
        quantity         INT NOT NULL DEFAULT 1,
        unit_price       DECIMAL(12,2) NOT NULL,
        size_multiplier  DECIMAL(4,2) NOT NULL,
        line_total       DECIMAL(12,2) NOT NULL,
        duration_minutes INT NOT NULL,
        buffer_minutes   INT NOT NULL DEFAULT 0,
        created_at       DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_booking_items PRIMARY KEY CLUSTERED (booking_item_id),
        CONSTRAINT FK_booking_items_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(booking_id),
        CONSTRAINT FK_booking_items_service FOREIGN KEY (service_id) REFERENCES dbo.services(service_id)
    );
END
GO

-- 5. payments — replaces the VietQR placeholder string with a real, persisted VNPAY record.
IF OBJECT_ID('dbo.payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.payments (
        payment_id       BIGINT IDENTITY(1,1) NOT NULL,
        booking_id       BIGINT NOT NULL,
        provider         VARCHAR(20) NOT NULL DEFAULT 'VNPAY',
        provider_txn_ref VARCHAR(100) NULL,
        amount           DECIMAL(12,2) NOT NULL,
        status           VARCHAR(20) NOT NULL,
        ipn_payload      NVARCHAR(MAX) NULL,
        created_at       DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        updated_at       DATETIME2 NULL,
        CONSTRAINT PK_payments PRIMARY KEY CLUSTERED (payment_id),
        CONSTRAINT CK_payments_status CHECK (status IN ('PENDING','SUCCESS','FAILED')),
        CONSTRAINT FK_payments_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(booking_id)
    );
END
GO

-- Indexes are guarded independently of the table's own IF OBJECT_ID(...) IS NULL block above:
-- if the table already exists but an index does not (e.g. a prior partial run), this still adds it.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_payments_booking' AND object_id = OBJECT_ID('dbo.payments'))
    CREATE INDEX IX_payments_booking ON dbo.payments(booking_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_payments_provider_txn' AND object_id = OBJECT_ID('dbo.payments'))
    CREATE UNIQUE INDEX UX_payments_provider_txn ON dbo.payments(provider, provider_txn_ref) WHERE provider_txn_ref IS NOT NULL;
GO

-- 6. idempotency_records — 24h dedupe store for side-effecting POST endpoints (BR-028).
IF OBJECT_ID('dbo.idempotency_records', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.idempotency_records (
        idempotency_key VARCHAR(100) NOT NULL,
        request_path    VARCHAR(200) NOT NULL,
        customer_id     BIGINT NULL,
        guest_phone     VARCHAR(20) NULL,
        response_status INT NOT NULL,
        response_body   NVARCHAR(MAX) NOT NULL,
        created_at      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        expires_at      DATETIME2 NOT NULL,
        CONSTRAINT PK_idempotency_records PRIMARY KEY CLUSTERED (idempotency_key)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_idempotency_expires' AND object_id = OBJECT_ID('dbo.idempotency_records'))
    CREATE INDEX IX_idempotency_expires ON dbo.idempotency_records(expires_at);
GO

-- 7. audit_logs — mandatory audit trail (BR-025).
IF OBJECT_ID('dbo.audit_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.audit_logs (
        id          BIGINT IDENTITY(1,1) NOT NULL,
        entity_type VARCHAR(40) NOT NULL,
        entity_id   VARCHAR(36) NOT NULL,
        action      VARCHAR(40) NOT NULL,
        old_value   NVARCHAR(MAX) NULL,
        new_value   NVARCHAR(MAX) NULL,
        reason      NVARCHAR(500) NULL,
        actor_id    VARCHAR(36) NOT NULL,
        actor_role  VARCHAR(20) NOT NULL,
        created_at  DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT PK_audit_logs PRIMARY KEY (id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_audit_entity' AND object_id = OBJECT_ID('dbo.audit_logs'))
    CREATE INDEX IX_audit_entity ON dbo.audit_logs(entity_type, entity_id, created_at DESC);
GO

-- 8. bookings evolution — support exactly one of customer or guest (BR-012, BR-023).
IF COL_LENGTH('dbo.bookings', 'guest_id') IS NULL
    ALTER TABLE dbo.bookings ADD guest_id BIGINT NULL;
GO

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'customer_id' AND is_nullable = 0
)
    ALTER TABLE dbo.bookings ALTER COLUMN customer_id BIGINT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_bookings_guest')
    ALTER TABLE dbo.bookings ADD CONSTRAINT FK_bookings_guest FOREIGN KEY (guest_id) REFERENCES dbo.guests(guest_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_bookings_customer_xor_guest')
    ALTER TABLE dbo.bookings ADD CONSTRAINT CK_bookings_customer_xor_guest CHECK (
        (customer_id IS NOT NULL AND guest_id IS NULL) OR (customer_id IS NULL AND guest_id IS NOT NULL)
    );
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_bookings_customer_status' AND object_id = OBJECT_ID('dbo.bookings'))
    CREATE INDEX IX_bookings_customer_status ON dbo.bookings(customer_id, status);
GO
