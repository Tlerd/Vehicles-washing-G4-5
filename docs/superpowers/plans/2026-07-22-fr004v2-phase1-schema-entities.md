# FR-004/FR-005 v2 Booking Engine — Phase 1: Schema & Entity/Repository Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the seven new v2 booking-engine tables (`guests`, `bays`, `slot_reservations`, `booking_items`, `payments`, `idempotency_records`, `audit_logs`) plus the minimal `bookings` evolution needed to support guest bookings, and their JPA entity/repository layer — with a real, isolated SQL Server test database backing repository-level tests — without changing any existing business logic, controller, or DTO.

**Architecture:** Additive, idempotent, hand-written SQL Server scripts (matching this repo's existing `Back-end/database/*.sql` convention — no Flyway/Liquibase), applied to both the local dev database (`autowash_pro`) and a new dedicated test database (`autowash_pro_test`) on the same SQL Server instance. New JPA entities and Spring Data repositories follow this codebase's exact existing conventions (Lombok `@Getter/@Setter/@NoArgsConstructor/@AllArgsConstructor`, `@ManyToOne` object references, plain `String` status/type columns). Repository-level tests use `@DataJpaTest` + `@AutoConfigureTestDatabase(replace = NONE)` + `@ActiveProfiles("test")` against the real test database, proving the DB-level constraints (especially the `UX_bay_slot` unique index that is the entire concurrency-safety mechanism for BR-030) actually hold.

**Tech Stack:** Java 17, Spring Boot 3.5.6 (Spring Data JPA, Spring Boot Test), SQL Server (`mssql-jdbc`), JUnit 5, Mockito, AssertJ (all already on the classpath — **no new Maven dependency is required for this phase**).

## Global Constraints

- Java 17 / Spring Boot parent 3.5.6 — unchanged, no version bumps.
- No new `Back-end/pom.xml` dependency is added in this phase. `@DataJpaTest`, AssertJ, and Mockito all ship transitively via the existing `spring-boot-starter-test` dependency.
- Migration convention (owner-confirmed): plain, hand-written, idempotent `.sql` scripts under `Back-end/database/`, applied manually — matching `FR001_FR013_upgrade_migration.sql` / `FR004_booking_duration_migration.sql`. No Flyway/Liquibase.
- Test isolation (owner-confirmed): a dedicated `autowash_pro_test` database on the same local SQL Server instance, selected via a new `application-test.properties` + `@ActiveProfiles("test")`. No Testcontainers.
- Entity/repository style must match the existing codebase exactly: Lombok `@Getter @Setter @NoArgsConstructor @AllArgsConstructor` on every entity; relations are always `@ManyToOne` object references (e.g. `private Booking booking;`), never raw FK-id fields; status/type/enum-like columns are plain `String` (matching `Booking.status`, `Customer.tier`, `Voucher.status`) **except** where an entity enum already exists (`VehicleSize`, reused as-is for `Guest.vehicleSize`); one public top-level type per file; one repository interface per entity, same shape as `VehicleRepository`/`BookingRepository`.
- Scope boundary (explicit — do not silently expand): this phase adds **only** the 7 tables named in the task plus the minimal `bookings` evolution (`guest_id`, nullable `customer_id`, `CK_bookings_customer_xor_guest`, `IX_bookings_customer_status` — this index is explicitly called for by BR-012's source doc). It does **not** touch `services`/`branches` pricing, booking-mode, or duration/buffer columns, does **not** add a `tiers` table, and does **not** add a `bay_id` column to `bookings` (bay assignment is fully represented via `slot_reservations.bay_id` joined by `booking_id` — adding a second, redundant bay pointer on `bookings` itself would be denormalized and is unnecessary). It implements **no business logic** (OTP, slot/bay allocation, pricing, VNPAY, RBAC state machine, scheduled jobs) — those are later phases (guest+OTP; booking engine + concurrency; payment; RBAC/Swagger/errors; full verification), to be planned and executed one at a time after this phase's tests pass.
- Every `mvn -f Back-end/pom.xml test` invocation in this plan requires `Back-end/.env`'s `DB_PASSWORD` to be loaded into the current shell's process environment first — see Task 1, Step 1. If you started a new shell session since then, re-run that step before any `mvn test` command in a later task.
- All new/modified Java source files use forward-slash paths below for readability; on Windows the same paths apply with either separator.

---

### Task 1: Additive v2 schema migration — write, apply to dev DB, create + populate test DB

**Files:**
- Create: `Back-end/database/FR004v2_booking_engine_schema_migration.sql`

**Interfaces:**
- Consumes: existing `Back-end/database/AutoWashPro.sql`, `FR001_FR013_upgrade_migration.sql`, `FR004_booking_duration_migration.sql` (baseline schema already on disk).
- Produces: 7 new tables (`guests`, `bays`, `slot_reservations`, `booking_items`, `payments`, `idempotency_records`, `audit_logs`) and 4 new `bookings` columns/constraints (`guest_id`, nullable `customer_id`, `CK_bookings_customer_xor_guest`, `IX_bookings_customer_status`) in both the `autowash_pro` (dev) and `autowash_pro_test` (test) databases. Every later task's entities/repositories/tests depend on this schema existing in both databases.

- [ ] **Step 1: Load `Back-end/.env` into the current shell session**

This is a one-time-per-shell-session prerequisite for every `sqlcmd`/`mvn test` command in this plan. Run in PowerShell from the repo root:

```powershell
Get-Content Back-end/.env | Where-Object { $_ -match '=' -and $_ -notmatch '^\s*#' } | ForEach-Object {
    $parts = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
}
```

Verify (does not print the secret value, only confirms it is set):
```powershell
if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) { Write-Host "DB_PASSWORD NOT SET" } else { Write-Host "DB_PASSWORD is set" }
```
Expected: `DB_PASSWORD is set`.

- [ ] **Step 2: Confirm `sqlcmd` is available**

```powershell
sqlcmd -?
```
Expected: usage text is printed (not "command not found"). If `sqlcmd` is unavailable, install the "SQL Server Command Line Utilities" (`mssql-tools18`) or run the SQL in this task's Step 3/Step 5 manually via SSMS/Azure Data Studio instead of via `sqlcmd`, then continue with Step 4/6's verification queries.

- [ ] **Step 3: Write the migration script**

Create `Back-end/database/FR004v2_booking_engine_schema_migration.sql`:

```sql
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
```

- [ ] **Step 4: Apply the migration to the dev database and verify**

```powershell
sqlcmd -S localhost -d autowash_pro -U sa -P $env:DB_PASSWORD -i Back-end/database/FR004v2_booking_engine_schema_migration.sql
```
Expected: no errors printed (informational "Commands completed successfully" per batch is fine).

```powershell
sqlcmd -S localhost -d autowash_pro -U sa -P $env:DB_PASSWORD -Q "SELECT name FROM sys.tables WHERE name IN ('guests','bays','slot_reservations','booking_items','payments','idempotency_records','audit_logs') ORDER BY name;"
```
Expected output: all 7 names listed, one per row:
```
audit_logs
bays
booking_items
guests
idempotency_records
payments
slot_reservations
```

```powershell
sqlcmd -S localhost -d autowash_pro -U sa -P $env:DB_PASSWORD -Q "SELECT is_nullable FROM sys.columns WHERE object_id = OBJECT_ID('dbo.bookings') AND name = 'customer_id';"
```
Expected: `1` (nullable).

- [ ] **Step 5: Create the test database and apply the full schema chain to it**

```powershell
sqlcmd -S localhost -U sa -P $env:DB_PASSWORD -Q "IF DB_ID('autowash_pro_test') IS NULL CREATE DATABASE autowash_pro_test;"
```

All four existing schema scripts hardcode `USE [autowash_pro]` at their top, which would silently redirect them back to the dev database if run with `-i` against the test database. Rewrite that one line in-memory (not on disk) and pipe to `sqlcmd` via stdin instead, in this exact order:

```powershell
$schemaScripts = @(
    'Back-end/database/AutoWashPro.sql',
    'Back-end/database/FR001_FR013_upgrade_migration.sql',
    'Back-end/database/FR004_booking_duration_migration.sql',
    'Back-end/database/FR004v2_booking_engine_schema_migration.sql'
)
foreach ($script in $schemaScripts) {
    (Get-Content $script) -replace '^USE \[autowash_pro\]$', 'USE [autowash_pro_test]' |
        sqlcmd -S localhost -U sa -P $env:DB_PASSWORD
}
```
Expected: no errors printed for any of the four scripts.

- [ ] **Step 6: Verify the test database schema**

```powershell
sqlcmd -S localhost -d autowash_pro_test -U sa -P $env:DB_PASSWORD -Q "SELECT name FROM sys.tables WHERE name IN ('guests','bays','slot_reservations','booking_items','payments','idempotency_records','audit_logs','bookings','customers','vehicles','branches','services') ORDER BY name;"
```
Expected: all 12 names listed (the 7 new tables plus the 5 pre-existing tables the entity tests in later tasks depend on).

- [ ] **Step 7: Commit**

```bash
git add Back-end/database/FR004v2_booking_engine_schema_migration.sql
git commit -m "feat: add v2 booking-engine schema (guests, bays, slot_reservations, booking_items, payments, idempotency_records, audit_logs)"
```

---

### Task 2: Test profile + shared repository-test infrastructure

**Files:**
- Create: `Back-end/src/main/resources/application-test.properties`
- Create: `Back-end/src/test/java/com/autowashpro/repository/RepositoryIntegrationTest.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/BookingTestFixtures.java`

**Interfaces:**
- Consumes: Task 1's `autowash_pro_test` database.
- Produces: `RepositoryIntegrationTest` (abstract base class carrying `@DataJpaTest @AutoConfigureTestDatabase(replace = Replace.NONE) @ActiveProfiles("test")` — every Task 3–10 repository test extends this). `BookingTestFixtures` static factory methods: `newBranch(String name): Branch`, `newCustomer(String phone): Customer`, `newVehicle(Customer customer, String plate): Vehicle`, `newBooking(Customer customer, Vehicle vehicle, Branch branch, String ref): Booking` — every Task 5/6/7/10 test uses these to build the required parent-entity chain.

- [ ] **Step 1: Write the test datasource profile**

Create `Back-end/src/main/resources/application-test.properties`:

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=autowash_pro_test;encrypt=false;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=false
```

- [ ] **Step 2: Write the shared `@DataJpaTest` base class**

Create `Back-end/src/test/java/com/autowashpro/repository/RepositoryIntegrationTest.java`:

```java
package com.autowashpro.repository;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
public abstract class RepositoryIntegrationTest {
}
```

`@DataJpaTest` wraps each `@Test` method in a transaction that rolls back automatically at the end — this is the "manual cleanup" mechanism: no `@AfterEach` deletes are needed for these repository-level tests, since nothing committed by a test is ever visible to the next one. (This rollback-per-test behavior only works for a single-threaded test; Phase 3's genuine concurrency tests will need a non-rolling-back `@SpringBootTest` instead — noted here for that later phase, not needed in this one.)

- [ ] **Step 3: Write the shared entity-chain test fixtures**

Create `Back-end/src/test/java/com/autowashpro/repository/BookingTestFixtures.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.entity.VehicleSize;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

final class BookingTestFixtures {

    private BookingTestFixtures() {
    }

    static Branch newBranch(String name) {
        Branch branch = new Branch();
        branch.setBranchName(name);
        branch.setStatus("ACTIVE");
        branch.setOpenTime(LocalTime.of(7, 0));
        branch.setCloseTime(LocalTime.of(18, 0));
        return branch;
    }

    static Customer newCustomer(String phone) {
        Customer customer = new Customer();
        customer.setFullName("Test Customer");
        customer.setPhone(phone);
        customer.setEmail(phone + "@test.local");
        customer.setPasswordHash("hash");
        customer.setTier("MEMBER");
        customer.setRole("CUSTOMER");
        customer.setAccumulatedPoints(0);
        customer.setTotalSpent(BigDecimal.ZERO);
        customer.setTotalWashes(0);
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());
        return customer;
    }

    static Vehicle newVehicle(Customer customer, String plate) {
        Vehicle vehicle = new Vehicle();
        vehicle.setCustomer(customer);
        vehicle.setLicensePlate(plate);
        vehicle.setBrand("Toyota");
        vehicle.setVehicleSize(VehicleSize.SEDAN);
        vehicle.setIsDefault(true);
        return vehicle;
    }

    static Booking newBooking(Customer customer, Vehicle vehicle, Branch branch, String ref) {
        Booking booking = new Booking();
        booking.setBookingRef(ref);
        booking.setCustomer(customer);
        booking.setVehicle(vehicle);
        booking.setBranch(branch);
        booking.setBookingDate(LocalDate.now().plusDays(1));
        booking.setBookingTime(LocalTime.of(9, 0));
        booking.setStatus("PENDING_DEPOSIT");
        booking.setCreatedAt(LocalDateTime.now());
        return booking;
    }
}
```

- [ ] **Step 4: Confirm the base class compiles and boots against the test DB**

Run (make sure Task 1 Step 1's env-loading has been done in this shell):
```powershell
mvn -f Back-end/pom.xml test-compile
```
Expected: `BUILD SUCCESS` — there is no test extending `RepositoryIntegrationTest` yet, so nothing runs, this only proves the class compiles and the profile file is well-formed.

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/resources/application-test.properties Back-end/src/test/java/com/autowashpro/repository/RepositoryIntegrationTest.java Back-end/src/test/java/com/autowashpro/repository/BookingTestFixtures.java
git commit -m "test: add isolated test-database profile and shared repository-test fixtures"
```

---

### Task 3: `Guest` entity + `GuestRepository`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/entity/Guest.java`
- Create: `Back-end/src/main/java/com/autowashpro/repository/GuestRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/GuestRepositoryTest.java`

**Interfaces:**
- Consumes: Task 1's `guests` table, Task 2's `RepositoryIntegrationTest`.
- Produces: `Guest` (fields: `guestId: Long`, `fullName: String`, `phone: String`, `email: String`, `licensePlate: String`, `vehicleSize: VehicleSize`, `mergedCustomer: Customer`, `mergedAt: LocalDateTime`, `createdAt: LocalDateTime`). `GuestRepository`: `findByPhone(String): Optional<Guest>`, `existsByPhone(String): boolean` — Phase 2's guest/OTP work depends on both of these exact signatures.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/GuestRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Guest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GuestRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private GuestRepository guestRepository;

    @Test
    void existsByPhone_returnsTrueAfterSave() {
        Guest guest = new Guest();
        guest.setFullName("Nguyen Van A");
        guest.setPhone("+84911222333");
        guest.setCreatedAt(LocalDateTime.now());

        guestRepository.saveAndFlush(guest);

        assertThat(guestRepository.existsByPhone("+84911222333")).isTrue();
        assertThat(guestRepository.findByPhone("+84911222333")).isPresent();
    }

    @Test
    void save_duplicatePhone_violatesUniqueConstraint() {
        Guest first = new Guest();
        first.setFullName("Nguyen Van A");
        first.setPhone("+84911222444");
        first.setCreatedAt(LocalDateTime.now());
        guestRepository.saveAndFlush(first);

        Guest second = new Guest();
        second.setFullName("Tran Thi B");
        second.setPhone("+84911222444");
        second.setCreatedAt(LocalDateTime.now());

        assertThatThrownBy(() -> guestRepository.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, `Guest`/`GuestRepository` do not exist yet.

- [ ] **Step 3: Write the `Guest` entity**

Create `Back-end/src/main/java/com/autowashpro/entity/Guest.java`:

```java
package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "guests")
public class Guest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "guest_id")
    private Long guestId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone", nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_size", length = 20)
    private VehicleSize vehicleSize;

    @ManyToOne
    @JoinColumn(name = "merged_customer_id")
    private Customer mergedCustomer;

    @Column(name = "merged_at")
    private LocalDateTime mergedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 4: Write the `GuestRepository`**

Create `Back-end/src/main/java/com/autowashpro/repository/GuestRepository.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Guest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GuestRepository extends JpaRepository<Guest, Long> {

    Optional<Guest> findByPhone(String phone);

    boolean existsByPhone(String phone);
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=GuestRepositoryTest
```
Expected: `BUILD SUCCESS`, 2 tests passed.

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/Guest.java Back-end/src/main/java/com/autowashpro/repository/GuestRepository.java Back-end/src/test/java/com/autowashpro/repository/GuestRepositoryTest.java
git commit -m "feat: add Guest entity and GuestRepository"
```

---

### Task 4: `Bay` entity + `BayRepository`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/entity/Bay.java`
- Create: `Back-end/src/main/java/com/autowashpro/repository/BayRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/BayRepositoryTest.java`

**Interfaces:**
- Consumes: Task 1's `bays` table, Task 2's `RepositoryIntegrationTest`/`BookingTestFixtures`, existing `BranchRepository`.
- Produces: `Bay` (fields: `bayId: Long`, `branch: Branch`, `bayCode: String`, `bayType: String`, `createdAt: LocalDateTime`). `BayRepository`: `findByBranchBranchId(Long): List<Bay>`, `findByBranchBranchIdAndBayType(Long, String): List<Bay>` — Task 11's `BaySeeder` and Phase 3's bay-allocation algorithm depend on both signatures.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/BayRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BranchRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BayRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private BayRepository bayRepository;

    @Test
    void findByBranchBranchIdAndBayType_returnsOnlyMatchingBays() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Bay Test Branch"));

        Bay quickBay = new Bay();
        quickBay.setBranch(branch);
        quickBay.setBayCode("Q1");
        quickBay.setBayType("QUICK");
        quickBay.setCreatedAt(LocalDateTime.now());
        bayRepository.saveAndFlush(quickBay);

        Bay detailBay = new Bay();
        detailBay.setBranch(branch);
        detailBay.setBayCode("D1");
        detailBay.setBayType("DETAIL");
        detailBay.setCreatedAt(LocalDateTime.now());
        bayRepository.saveAndFlush(detailBay);

        List<Bay> quickBays = bayRepository.findByBranchBranchIdAndBayType(branch.getBranchId(), "QUICK");

        assertThat(quickBays).hasSize(1);
        assertThat(quickBays.get(0).getBayCode()).isEqualTo("Q1");
        assertThat(bayRepository.findByBranchBranchId(branch.getBranchId())).hasSize(2);
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BayRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, `Bay`/`BayRepository` do not exist yet.

- [ ] **Step 3: Write the `Bay` entity**

Create `Back-end/src/main/java/com/autowashpro/entity/Bay.java`:

```java
package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bays")
public class Bay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bay_id")
    private Long bayId;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "bay_code", nullable = false, length = 20)
    private String bayCode;

    @Column(name = "bay_type", nullable = false, length = 20)
    private String bayType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 4: Write the `BayRepository`**

Create `Back-end/src/main/java/com/autowashpro/repository/BayRepository.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Bay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BayRepository extends JpaRepository<Bay, Long> {

    List<Bay> findByBranchBranchId(Long branchId);

    List<Bay> findByBranchBranchIdAndBayType(Long branchId, String bayType);
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BayRepositoryTest
```
Expected: `BUILD SUCCESS`, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/Bay.java Back-end/src/main/java/com/autowashpro/repository/BayRepository.java Back-end/src/test/java/com/autowashpro/repository/BayRepositoryTest.java
git commit -m "feat: add Bay entity and BayRepository"
```

---

### Task 5: `SlotReservation` entity + `SlotReservationRepository` (the concurrency-safety backbone)

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/entity/SlotReservation.java`
- Create: `Back-end/src/main/java/com/autowashpro/repository/SlotReservationRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/SlotReservationRepositoryTest.java`

**Interfaces:**
- Consumes: Task 1's `slot_reservations` table (including `UX_bay_slot`), Task 4's `Bay`/`BayRepository`, Task 2's fixtures, existing `BranchRepository`/`CustomerRepository`/`VehicleRepository`/`BookingRepository`.
- Produces: `SlotReservation` (fields: `reservationId: Long`, `branch: Branch`, `bay: Bay`, `slotTime: LocalDateTime`, `booking: Booking`, `status: String`, `expiresAt: LocalDateTime`). `SlotReservationRepository`: `findByBayBayIdAndSlotTimeBetween(Long, LocalDateTime, LocalDateTime): List<SlotReservation>`, `findByBookingBookingId(Long): List<SlotReservation>` — Phase 3's slot-availability query and hold-release job depend on both signatures.

This task's test is the load-bearing proof for BR-030: it directly demonstrates that `UX_bay_slot` rejects a second reservation for the same `(bay_id, slot_time)`, which is the entire mechanism Phase 3's "two concurrent requests → exactly one 201, one 409" test will rely on.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/SlotReservationRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.SlotReservation;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SlotReservationRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private BayRepository bayRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SlotReservationRepository slotReservationRepository;

    @Test
    void save_secondReservationForSameBaySlotTime_violatesUniqueConstraint() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Slot Test Branch"));

        Bay bay = new Bay();
        bay.setBranch(branch);
        bay.setBayCode("Q1");
        bay.setBayType("QUICK");
        bay.setCreatedAt(LocalDateTime.now());
        bay = bayRepository.saveAndFlush(bay);

        Customer customerA = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333001"));
        Vehicle vehicleA = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customerA, "51A-11111"));
        Booking bookingA = bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customerA, vehicleA, branch, "AWP-TESTA1"));

        Customer customerB = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333002"));
        Vehicle vehicleB = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customerB, "51A-22222"));
        Booking bookingB = bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customerB, vehicleB, branch, "AWP-TESTA2"));

        LocalDateTime slotTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);

        SlotReservation first = new SlotReservation();
        first.setBranch(branch);
        first.setBay(bay);
        first.setSlotTime(slotTime);
        first.setBooking(bookingA);
        first.setStatus("HOLD");
        first.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        slotReservationRepository.saveAndFlush(first);

        SlotReservation second = new SlotReservation();
        second.setBranch(branch);
        second.setBay(bay);
        second.setSlotTime(slotTime);
        second.setBooking(bookingB);
        second.setStatus("HOLD");
        second.setExpiresAt(LocalDateTime.now().plusMinutes(15));

        assertThatThrownBy(() -> slotReservationRepository.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=SlotReservationRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, `SlotReservation`/`SlotReservationRepository` do not exist yet.

- [ ] **Step 3: Write the `SlotReservation` entity**

Create `Back-end/src/main/java/com/autowashpro/entity/SlotReservation.java`:

```java
package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "slot_reservations")
public class SlotReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    private Long reservationId;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "bay_id", nullable = false)
    private Bay bay;

    @Column(name = "slot_time", nullable = false)
    private LocalDateTime slotTime;

    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "status", nullable = false, length = 10)
    private String status;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
```

- [ ] **Step 4: Write the `SlotReservationRepository`**

Create `Back-end/src/main/java/com/autowashpro/repository/SlotReservationRepository.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.SlotReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SlotReservationRepository extends JpaRepository<SlotReservation, Long> {

    List<SlotReservation> findByBayBayIdAndSlotTimeBetween(Long bayId, LocalDateTime from, LocalDateTime to);

    List<SlotReservation> findByBookingBookingId(Long bookingId);
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=SlotReservationRepositoryTest
```
Expected: `BUILD SUCCESS`, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/SlotReservation.java Back-end/src/main/java/com/autowashpro/repository/SlotReservationRepository.java Back-end/src/test/java/com/autowashpro/repository/SlotReservationRepositoryTest.java
git commit -m "feat: add SlotReservation entity and repository, proving the UX_bay_slot double-booking guard"
```

---

### Task 6: `BookingItem` entity + `BookingItemRepository`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/entity/BookingItem.java`
- Create: `Back-end/src/main/java/com/autowashpro/repository/BookingItemRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/BookingItemRepositoryTest.java`

**Interfaces:**
- Consumes: Task 1's `booking_items` table, Task 2's fixtures, existing `BranchRepository`/`CustomerRepository`/`VehicleRepository`/`BookingRepository`/`ServiceRepository`.
- Produces: `BookingItem` (fields: `bookingItemId: Long`, `booking: Booking`, `service: com.autowashpro.entity.Service`, `quantity: Integer`, `unitPrice: BigDecimal`, `sizeMultiplier: BigDecimal`, `lineTotal: BigDecimal`, `durationMinutes: Integer`, `bufferMinutes: Integer`, `createdAt: LocalDateTime`). `BookingItemRepository`: `findByBookingBookingId(Long): List<BookingItem>` — Phase 3's pricing/snapshot code and Phase 3's booking-response builder depend on this signature.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/BookingItemRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.BookingItem;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.repository.BookingItemRepository;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.ServiceRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BookingItemRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BookingItemRepository bookingItemRepository;

    @Test
    void findByBookingBookingId_returnsSnapshottedLineItem() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Booking Item Test Branch"));
        Customer customer = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333003"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customer, "51A-33333"));
        Booking booking = bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-TESTB1"));

        com.autowashpro.entity.Service service = new com.autowashpro.entity.Service();
        service.setServiceCode("TESTWASH");
        service.setServiceName("Test Wash");
        service.setBasePrice(new BigDecimal("100000"));
        service.setDurationMinutes(20);
        service.setStatus("ACTIVE");
        service = serviceRepository.saveAndFlush(service);

        BookingItem item = new BookingItem();
        item.setBooking(booking);
        item.setService(service);
        item.setQuantity(1);
        item.setUnitPrice(new BigDecimal("100000"));
        item.setSizeMultiplier(new BigDecimal("1.20"));
        item.setLineTotal(new BigDecimal("120000"));
        item.setDurationMinutes(20);
        item.setBufferMinutes(10);
        item.setCreatedAt(LocalDateTime.now());
        bookingItemRepository.saveAndFlush(item);

        List<BookingItem> items = bookingItemRepository.findByBookingBookingId(booking.getBookingId());

        assertThat(items).hasSize(1);
        assertThat(items.get(0).getLineTotal()).isEqualByComparingTo("120000");
        assertThat(items.get(0).getSizeMultiplier()).isEqualByComparingTo("1.20");
        assertThat(items.get(0).getDurationMinutes()).isEqualTo(20);
        assertThat(items.get(0).getBufferMinutes()).isEqualTo(10);
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BookingItemRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, `BookingItem`/`BookingItemRepository` do not exist yet.

- [ ] **Step 3: Write the `BookingItem` entity**

Create `Back-end/src/main/java/com/autowashpro/entity/BookingItem.java`:

```java
package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "booking_items")
public class BookingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_item_id")
    private Long bookingItemId;

    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "size_multiplier", nullable = false)
    private BigDecimal sizeMultiplier;

    @Column(name = "line_total", nullable = false)
    private BigDecimal lineTotal;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "buffer_minutes", nullable = false)
    private Integer bufferMinutes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 4: Write the `BookingItemRepository`**

Create `Back-end/src/main/java/com/autowashpro/repository/BookingItemRepository.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.BookingItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingItemRepository extends JpaRepository<BookingItem, Long> {

    List<BookingItem> findByBookingBookingId(Long bookingId);
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BookingItemRepositoryTest
```
Expected: `BUILD SUCCESS`, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/BookingItem.java Back-end/src/main/java/com/autowashpro/repository/BookingItemRepository.java Back-end/src/test/java/com/autowashpro/repository/BookingItemRepositoryTest.java
git commit -m "feat: add BookingItem entity and repository for priced line-item snapshots"
```

---

### Task 7: `Payment` entity + `PaymentRepository`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/entity/Payment.java`
- Create: `Back-end/src/main/java/com/autowashpro/repository/PaymentRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/PaymentRepositoryTest.java`

**Interfaces:**
- Consumes: Task 1's `payments` table, Task 2's fixtures, existing `BranchRepository`/`CustomerRepository`/`VehicleRepository`/`BookingRepository`.
- Produces: `Payment` (fields: `paymentId: Long`, `booking: Booking`, `provider: String`, `providerTxnRef: String`, `amount: BigDecimal`, `status: String`, `ipnPayload: String`, `createdAt: LocalDateTime`, `updatedAt: LocalDateTime`). `PaymentRepository`: `findByBookingBookingId(Long): List<Payment>` — Phase 4's VNPAY create/IPN/return handlers depend on this signature.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/PaymentRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Payment;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.PaymentRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Test
    void findByBookingBookingId_returnsPersistedPayment() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Payment Test Branch"));
        Customer customer = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333004"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customer, "51A-44444"));
        Booking booking = bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-TESTC1"));

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setProvider("VNPAY");
        payment.setAmount(new BigDecimal("200000"));
        payment.setStatus("PENDING");
        payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.saveAndFlush(payment);

        List<Payment> payments = paymentRepository.findByBookingBookingId(booking.getBookingId());

        assertThat(payments).hasSize(1);
        assertThat(payments.get(0).getProvider()).isEqualTo("VNPAY");
        assertThat(payments.get(0).getStatus()).isEqualTo("PENDING");
        assertThat(payments.get(0).getAmount()).isEqualByComparingTo("200000");
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=PaymentRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, `Payment`/`PaymentRepository` do not exist yet.

- [ ] **Step 3: Write the `Payment` entity**

Create `Back-end/src/main/java/com/autowashpro/entity/Payment.java`:

```java
package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_txn_ref", length = 100)
    private String providerTxnRef;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "ipn_payload", columnDefinition = "NVARCHAR(MAX)")
    private String ipnPayload;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 4: Write the `PaymentRepository`**

Create `Back-end/src/main/java/com/autowashpro/repository/PaymentRepository.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByBookingBookingId(Long bookingId);
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=PaymentRepositoryTest
```
Expected: `BUILD SUCCESS`, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/Payment.java Back-end/src/main/java/com/autowashpro/repository/PaymentRepository.java Back-end/src/test/java/com/autowashpro/repository/PaymentRepositoryTest.java
git commit -m "feat: add Payment entity and repository, replacing the VietQR placeholder's data model"
```

---

### Task 8: `IdempotencyRecord` entity + `IdempotencyRecordRepository`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/entity/IdempotencyRecord.java`
- Create: `Back-end/src/main/java/com/autowashpro/repository/IdempotencyRecordRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/IdempotencyRecordRepositoryTest.java`

**Interfaces:**
- Consumes: Task 1's `idempotency_records` table, Task 2's `RepositoryIntegrationTest`.
- Produces: `IdempotencyRecord` (fields: `idempotencyKey: String` (`@Id`, not generated — the client-supplied `Idempotency-Key` header value), `requestPath: String`, `customerId: Long`, `guestPhone: String`, `responseStatus: Integer`, `responseBody: String`, `createdAt: LocalDateTime`, `expiresAt: LocalDateTime`). `IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, String>` (inherits `findById(String)`) — Phase 3's `POST /api/v1/bookings` idempotency check depends on this.

Note for Phase 3 (not solved in this task): `IdempotencyRecord`'s `@Id` is a client-assigned `String`, not a generated key. Phase 3's actual usage pattern will be "find by key first, only save if absent" (not a raw duplicate-insert), so this task's test only proves the basic save/find round-trip — it does not need to prove duplicate-key-throws, since production code will never blindly re-save an existing key. Phase 3 must still decide how two truly concurrent requests with the same brand-new key are handled at the database level; that is out of scope here.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/IdempotencyRecordRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.IdempotencyRecord;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class IdempotencyRecordRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private IdempotencyRecordRepository idempotencyRecordRepository;

    @Test
    void save_and_findById_roundTripsAllFields() {
        IdempotencyRecord record = new IdempotencyRecord();
        record.setIdempotencyKey("test-key-001");
        record.setRequestPath("/api/v1/bookings");
        record.setCustomerId(1L);
        record.setResponseStatus(201);
        record.setResponseBody("{\"bookingRef\":\"AWP-TESTD1\"}");
        record.setCreatedAt(LocalDateTime.now());
        record.setExpiresAt(LocalDateTime.now().plusHours(24));

        idempotencyRecordRepository.saveAndFlush(record);

        IdempotencyRecord found = idempotencyRecordRepository.findById("test-key-001").orElseThrow();
        assertThat(found.getRequestPath()).isEqualTo("/api/v1/bookings");
        assertThat(found.getResponseStatus()).isEqualTo(201);
        assertThat(found.getResponseBody()).contains("AWP-TESTD1");
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=IdempotencyRecordRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, `IdempotencyRecord`/`IdempotencyRecordRepository` do not exist yet.

- [ ] **Step 3: Write the `IdempotencyRecord` entity**

Create `Back-end/src/main/java/com/autowashpro/entity/IdempotencyRecord.java`:

```java
package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "idempotency_records")
public class IdempotencyRecord {

    @Id
    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    @Column(name = "request_path", nullable = false, length = 200)
    private String requestPath;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "guest_phone", length = 20)
    private String guestPhone;

    @Column(name = "response_status", nullable = false)
    private Integer responseStatus;

    @Column(name = "response_body", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String responseBody;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
```

- [ ] **Step 4: Write the `IdempotencyRecordRepository`**

Create `Back-end/src/main/java/com/autowashpro/repository/IdempotencyRecordRepository.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, String> {
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=IdempotencyRecordRepositoryTest
```
Expected: `BUILD SUCCESS`, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/IdempotencyRecord.java Back-end/src/main/java/com/autowashpro/repository/IdempotencyRecordRepository.java Back-end/src/test/java/com/autowashpro/repository/IdempotencyRecordRepositoryTest.java
git commit -m "feat: add IdempotencyRecord entity and repository"
```

---

### Task 9: `AuditLog` entity + `AuditLogRepository`

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/entity/AuditLog.java`
- Create: `Back-end/src/main/java/com/autowashpro/repository/AuditLogRepository.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/AuditLogRepositoryTest.java`

**Interfaces:**
- Consumes: Task 1's `audit_logs` table, Task 2's `RepositoryIntegrationTest`.
- Produces: `AuditLog` (fields: `id: Long`, `entityType: String`, `entityId: String`, `action: String`, `oldValue: String`, `newValue: String`, `reason: String`, `actorId: String`, `actorRole: String`, `createdAt: LocalDateTime`). `AuditLogRepository`: `findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String, String): List<AuditLog>` — every later phase's audit-writing code (BR-020, BR-025, BR-031, BR-033) depends on this signature.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/AuditLogRepositoryTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.AuditLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AuditLogRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void findByEntityTypeAndEntityId_ordersNewestFirst() {
        AuditLog older = new AuditLog();
        older.setEntityType("BOOKING");
        older.setEntityId("42");
        older.setAction("STATUS_CHANGED");
        older.setActorId("1");
        older.setActorRole("STAFF");
        older.setCreatedAt(LocalDateTime.now().minusMinutes(10));
        auditLogRepository.saveAndFlush(older);

        AuditLog newer = new AuditLog();
        newer.setEntityType("BOOKING");
        newer.setEntityId("42");
        newer.setAction("STATUS_CHANGED");
        newer.setActorId("1");
        newer.setActorRole("STAFF");
        newer.setCreatedAt(LocalDateTime.now());
        auditLogRepository.saveAndFlush(newer);

        List<AuditLog> logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("BOOKING", "42");

        assertThat(logs).hasSize(2);
        assertThat(logs.get(0).getId()).isEqualTo(newer.getId());
        assertThat(logs.get(1).getId()).isEqualTo(older.getId());
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=AuditLogRepositoryTest
```
Expected: `BUILD FAILURE` — compile error, `AuditLog`/`AuditLogRepository` do not exist yet.

- [ ] **Step 3: Write the `AuditLog` entity**

Create `Back-end/src/main/java/com/autowashpro/entity/AuditLog.java`:

```java
package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    @Column(name = "action", nullable = false, length = 40)
    private String action;

    @Column(name = "old_value", columnDefinition = "NVARCHAR(MAX)")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "NVARCHAR(MAX)")
    private String newValue;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "actor_id", nullable = false, length = 36)
    private String actorId;

    @Column(name = "actor_role", nullable = false, length = 20)
    private String actorRole;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
```

- [ ] **Step 4: Write the `AuditLogRepository`**

Create `Back-end/src/main/java/com/autowashpro/repository/AuditLogRepository.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);
}
```

- [ ] **Step 5: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=AuditLogRepositoryTest
```
Expected: `BUILD SUCCESS`, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/AuditLog.java Back-end/src/main/java/com/autowashpro/repository/AuditLogRepository.java Back-end/src/test/java/com/autowashpro/repository/AuditLogRepositoryTest.java
git commit -m "feat: add AuditLog entity and repository"
```

---

### Task 10: Evolve `Booking` to support exactly one of customer or guest

**Files:**
- Modify: `Back-end/src/main/java/com/autowashpro/entity/Booking.java`
- Create: `Back-end/src/test/java/com/autowashpro/repository/BookingGuestSupportTest.java`

**Interfaces:**
- Consumes: Task 1's `CK_bookings_customer_xor_guest` constraint, Task 3's `Guest` entity, Task 2's fixtures.
- Produces: `Booking.guest: Guest` (new field) and `Booking.customer` now nullable — Phase 2's guest-booking creation code and Phase 3's booking-response builder depend on both.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/repository/BookingGuestSupportTest.java`:

```java
package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Guest;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.GuestRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingGuestSupportTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    void save_bookingWithGuestAndNoCustomer_persistsSuccessfully() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Guest Booking Test Branch"));
        Customer vehicleOwner = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333005"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(vehicleOwner, "51A-55555"));

        Guest guest = new Guest();
        guest.setFullName("Guest Booker");
        guest.setPhone("+84911333006");
        guest.setCreatedAt(LocalDateTime.now());
        guest = guestRepository.saveAndFlush(guest);

        Booking booking = BookingTestFixtures.newBooking(vehicleOwner, vehicle, branch, "AWP-TESTE1");
        booking.setCustomer(null);
        booking.setGuest(guest);

        Booking saved = bookingRepository.saveAndFlush(booking);

        assertThat(saved.getBookingId()).isNotNull();
        assertThat(saved.getCustomer()).isNull();
        assertThat(saved.getGuest().getGuestId()).isEqualTo(guest.getGuestId());
    }

    @Test
    void save_bookingWithNeitherCustomerNorGuest_violatesCheckConstraint() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Guest Booking Test Branch 2"));
        Customer vehicleOwner = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333007"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(vehicleOwner, "51A-66666"));

        Booking booking = BookingTestFixtures.newBooking(vehicleOwner, vehicle, branch, "AWP-TESTE2");
        booking.setCustomer(null);

        assertThatThrownBy(() -> bookingRepository.saveAndFlush(booking))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_bookingWithBothCustomerAndGuest_violatesCheckConstraint() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Guest Booking Test Branch 3"));
        Customer customer = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333008"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customer, "51A-77777"));

        Guest guest = new Guest();
        guest.setFullName("Guest Booker 2");
        guest.setPhone("+84911333009");
        guest.setCreatedAt(LocalDateTime.now());
        guest = guestRepository.saveAndFlush(guest);

        Booking booking = BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-TESTE3");
        booking.setGuest(guest);

        assertThatThrownBy(() -> bookingRepository.saveAndFlush(booking))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BookingGuestSupportTest
```
Expected: `BUILD FAILURE` — compile error, `Booking.setGuest(...)`/`Booking.getGuest()` do not exist yet.

- [ ] **Step 3: Modify the `Booking` entity**

In `Back-end/src/main/java/com/autowashpro/entity/Booking.java`, change the `customer` field's `@JoinColumn` to drop `nullable = false` (making it implicitly nullable, matching e.g. `Branch.address`'s no-`nullable`-attribute style), and add a new `guest` field:

```java
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;
```
(was: `@JoinColumn(name = "customer_id", nullable = false)`)

Add immediately after the `vehicle` field:

```java
    @ManyToOne
    @JoinColumn(name = "guest_id")
    private Guest guest;
```

- [ ] **Step 4: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BookingGuestSupportTest
```
Expected: `BUILD SUCCESS`, 3 tests passed.

- [ ] **Step 5: Run the existing `BookingManagementServiceTest` to confirm no regression**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BookingManagementServiceTest
```
Expected: `BUILD SUCCESS`, 2 tests passed (unchanged — this test always sets a customer, so the nullability relaxation does not affect it).

- [ ] **Step 6: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/entity/Booking.java Back-end/src/test/java/com/autowashpro/repository/BookingGuestSupportTest.java
git commit -m "feat: evolve Booking entity to support exactly one of customer or guest"
```

---

### Task 11: `BaySeeder` — seed 2 QUICK + 1 DETAIL + 1 UNIVERSAL bays per branch

**Files:**
- Create: `Back-end/src/main/java/com/autowashpro/config/BaySeeder.java`
- Create: `Back-end/src/test/java/com/autowashpro/config/BaySeederTest.java`

**Interfaces:**
- Consumes: Task 4's `Bay`/`BayRepository`, existing `BranchRepository`.
- Produces: a `CommandLineRunner` bean that runs once at application startup (matching `SystemAccountSeeder`'s existing pattern) — no other task depends on this directly, but it is a prerequisite for manually verifying Phase 3's bay-allocation logic against real seeded data later.

- [ ] **Step 1: Write the failing test**

Create `Back-end/src/test/java/com/autowashpro/config/BaySeederTest.java`:

```java
package com.autowashpro.config;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BranchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BaySeederTest {

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private BayRepository bayRepository;

    private BaySeeder baySeeder;

    @BeforeEach
    void setUp() {
        baySeeder = new BaySeeder(branchRepository, bayRepository);
    }

    @Test
    void run_branchWithNoBays_seedsTwoQuickOneDetailOneUniversal() throws Exception {
        Branch branch = new Branch();
        branch.setBranchId(1L);
        when(branchRepository.findAll()).thenReturn(List.of(branch));
        when(bayRepository.findByBranchBranchId(1L)).thenReturn(List.of());

        baySeeder.run();

        ArgumentCaptor<Bay> captor = ArgumentCaptor.forClass(Bay.class);
        verify(bayRepository, times(4)).save(captor.capture());
        List<String> types = captor.getAllValues().stream().map(Bay::getBayType).toList();
        assertThat(types).containsExactly("QUICK", "QUICK", "DETAIL", "UNIVERSAL");
    }

    @Test
    void run_branchAlreadySeeded_skipsSeeding() throws Exception {
        Branch branch = new Branch();
        branch.setBranchId(1L);
        when(branchRepository.findAll()).thenReturn(List.of(branch));
        when(bayRepository.findByBranchBranchId(1L)).thenReturn(List.of(new Bay()));

        baySeeder.run();

        verify(bayRepository, never()).save(any());
    }
}
```

- [ ] **Step 2: Run the test to confirm it fails**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BaySeederTest
```
Expected: `BUILD FAILURE` — compile error, `BaySeeder` does not exist yet.

- [ ] **Step 3: Write the `BaySeeder`**

Create `Back-end/src/main/java/com/autowashpro/config/BaySeeder.java`:

```java
package com.autowashpro.config;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BranchRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class BaySeeder implements CommandLineRunner {

    private final BranchRepository branches;
    private final BayRepository bays;

    public BaySeeder(BranchRepository branches, BayRepository bays) {
        this.branches = branches;
        this.bays = bays;
    }

    @Override
    public void run(String... args) {
        for (Branch branch : branches.findAll()) {
            if (!bays.findByBranchBranchId(branch.getBranchId()).isEmpty()) {
                continue;
            }
            seedBay(branch, "Q1", "QUICK");
            seedBay(branch, "Q2", "QUICK");
            seedBay(branch, "D1", "DETAIL");
            seedBay(branch, "U1", "UNIVERSAL");
        }
    }

    private void seedBay(Branch branch, String code, String type) {
        Bay bay = new Bay();
        bay.setBranch(branch);
        bay.setBayCode(code);
        bay.setBayType(type);
        bay.setCreatedAt(LocalDateTime.now());
        bays.save(bay);
    }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```powershell
mvn -f Back-end/pom.xml test -Dtest=BaySeederTest
```
Expected: `BUILD SUCCESS`, 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add Back-end/src/main/java/com/autowashpro/config/BaySeeder.java Back-end/src/test/java/com/autowashpro/config/BaySeederTest.java
git commit -m "feat: seed 2 QUICK + 1 DETAIL + 1 UNIVERSAL bays per branch (BR-029)"
```

---

### Task 12: Full-suite verification, live evidence, and progress records

**Files:**
- Modify: `PROGRESS.md`
- Create: `docs/ai-logs/m1/2026-07-22-fr004v2-phase1-schema-entities.md`

**Interfaces:**
- Consumes: every prior task in this plan.
- Produces: recorded evidence per AGENTS.md's "Evidence and progress" requirement; no code interface.

- [ ] **Step 1: Run the complete backend test suite**

```powershell
mvn -f Back-end/pom.xml test
```
Expected: `BUILD SUCCESS`. Count the total: 13 pre-existing tests (`AuthServiceImplTest` 7, `VehicleServiceImplTest` 3, `GlobalExceptionHandlerTest` 1, `BookingManagementServiceTest` 2) + 14 new tests from this plan (`GuestRepositoryTest` 2, `BayRepositoryTest` 1, `SlotReservationRepositoryTest` 1, `BookingItemRepositoryTest` 1, `PaymentRepositoryTest` 1, `IdempotencyRecordRepositoryTest` 1, `AuditLogRepositoryTest` 1, `BookingGuestSupportTest` 3, `BaySeederTest` 2, plus this task adds no new tests) = 27 tests total, 0 failures.

- [ ] **Step 2: Confirm live schema state on both databases one more time**

```powershell
sqlcmd -S localhost -d autowash_pro -U sa -P $env:DB_PASSWORD -Q "SELECT COUNT(*) AS bay_count FROM bays; SELECT COUNT(*) AS reservation_count FROM slot_reservations;"
sqlcmd -S localhost -d autowash_pro_test -U sa -P $env:DB_PASSWORD -Q "SELECT COUNT(*) AS bay_count FROM bays;"
```
Record the actual counts printed (dev DB's `bay_count` should be a multiple of 4 once the app has been started at least once after Task 11, since `BaySeeder` runs on every app boot; `autowash_pro_test`'s row counts reflect only what Task 1-11's tests left behind, which is 0 since `@DataJpaTest` rolls every test back).

- [ ] **Step 3: Update `PROGRESS.md`**

Add a new "Last AI-assisted work" entry (above the existing most-recent entry) summarizing: Phase 1 of the owner-approved backend-first FR-004/FR-005 v2 plan is complete — the 7 new tables plus `bookings` guest-support evolution are live on both `autowash_pro` and `autowash_pro_test`, with 14 new passing tests (including the `UX_bay_slot` double-booking-guard proof and the `CK_bookings_customer_xor_guest` proof), `mvn -f Back-end/pom.xml test` passing 27/27. State explicitly: no business logic (OTP, slot allocation, pricing, VNPAY, RBAC state machine) has been implemented yet — Phase 2 (guest + OTP verification service) is next, pending its own plan.

- [ ] **Step 4: Write the AI log**

Create `docs/ai-logs/m1/2026-07-22-fr004v2-phase1-schema-entities.md` recording: the task, the three owner decisions confirmed before planning (sequential sub-plans; manual idempotent SQL scripts; dedicated test schema/DB with manual cleanup — i.e., `@DataJpaTest` rollback), the exact files created/modified (list every file from Tasks 1–11), the exact verification commands run and their results (Step 1/Step 2 of this task), and the explicit scope boundary (no `tiers` table, no `services`/`branches` pricing columns, no business logic — schema and entity/repository layer only).

- [ ] **Step 5: Commit**

```bash
git add PROGRESS.md docs/ai-logs/m1/2026-07-22-fr004v2-phase1-schema-entities.md
git commit -m "docs: record Phase 1 (v2 booking-engine schema + entities) evidence in PROGRESS.md and AI log"
```
