-- FR004v2 Phase 2 — guest verification proof table.
-- Additive and idempotent — safe to run repeatedly against autowash_pro or autowash_pro_test.
USE [autowash_pro]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- phone_verification_proofs — short-lived, single-use, purpose-bound proof that the caller
-- controls a phone number, issued only after a real server-side Firebase ID token verification
-- succeeds. Never trust a client-supplied "otpVerified" flag; this table is the sole source of
-- truth for "has this phone been verified for this purpose, and has that verification already
-- been spent." consumed_at is set exactly once via an atomic conditional UPDATE (see
-- PhoneVerificationProofRepository) — no other write path may set it.
IF OBJECT_ID('dbo.phone_verification_proofs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.phone_verification_proofs (
        proof_token VARCHAR(64) NOT NULL,
        phone       VARCHAR(20) NOT NULL,
        purpose     VARCHAR(30) NOT NULL,
        issued_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        expires_at  DATETIME2 NOT NULL,
        consumed_at DATETIME2 NULL,
        CONSTRAINT PK_phone_verification_proofs PRIMARY KEY CLUSTERED (proof_token),
        CONSTRAINT CK_phone_verification_proofs_purpose CHECK (purpose IN ('GUEST_BOOKING','GUEST_BOOKING_LOOKUP'))
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_phone_verification_proofs_expires' AND object_id = OBJECT_ID('dbo.phone_verification_proofs'))
    CREATE INDEX IX_phone_verification_proofs_expires ON dbo.phone_verification_proofs(expires_at);
GO
