# AI Log — FR-004/FR-005 v2 Backend Phase 1

## Purpose

Record the implementation state of the backend/API-first FR-004 and FR-005 v2
work so a later agent can continue without repeating completed work.

Scope is backend only: schema, JPA entities, repositories, and Phase 1 test
infrastructure. Frontend changes, FE–BE integration, OTP business logic, slot
allocation, VNPAY, RBAC, Swagger, and the remaining API behavior are deferred
to later phases.

## Planning decisions

- Work is split into sequential sub-plans.
- Migrations remain manual, additive, hand-written, and idempotent SQL Server
  scripts; Flyway and Liquibase are not being introduced.
- SQL Server integration tests use the dedicated `autowash_pro_test` database
  with manual cleanup; no destructive migration or broad reset is permitted.
- TDD and independent implementation/review checkpoints are required.
- Existing unrelated staged and uncommitted work in the checkout must be
  preserved.

## Phase 1 plan

Plan: `docs/superpowers/plans/2026-07-22-fr004v2-phase1-schema-entities.md`

Goal: add the seven v2 booking-engine tables, evolve `bookings` safely for
guest bookings, add the entity/repository layer, seed bays, and establish
SQL Server-compatible repository test fixtures.

## Completed work

**Phase 1 is now complete.** All 12 tasks are done, committed, and
independently reviewed:

1. Additive/idempotent SQL Server migration for `guests`, `bays`,
   `slot_reservations`, `booking_items`, `payments`, `idempotency_records`,
   `audit_logs`, plus safe `bookings` evolution. The migration includes
   `SET QUOTED_IDENTIFIER ON`, independently guarded indexes, the bay-slot
   unique constraint, and the customer/guest structure.
2. SQL Server test profile and shared repository fixtures.
3. `Guest` entity and repository.
4. `Bay` entity and repository.
5. `SlotReservation` entity and repository, including a test that proves the
   database-level `(bay_id, slot_time)` uniqueness constraint. The test
   assertion was strengthened to identify the intended constraint rather than
   accepting any `DataIntegrityViolationException`.
6. `BookingItem` entity and repository.
7. `Payment` entity and repository.
8. `IdempotencyRecord` entity and repository, using a client-assigned String
   primary key and no generated ID.
9. `AuditLog` entity and repository (`findByEntityTypeAndEntityIdOrderByCreatedAtDesc`),
   mapped onto the `audit_logs` table from Task 1 (matches BR-025's schema
   field-for-field, independently re-verified by the reviewer against the
   real migration DDL, not just the plan's copy of it).
10. `Booking` entity evolved to support exactly one of customer or guest: the
    `customer` join column's `nullable = false` was dropped and a new
    `@ManyToOne guest` field was added. A new `BookingGuestSupportTest`
    proves all three cases the DB-level `CK_bookings_customer_xor_guest`
    check constraint is meant to enforce: guest-only persists with
    `customer == null`; neither set violates the constraint; both set also
    violates it. Regression-checked against the existing
    `BookingManagementServiceTest` (unaffected, since that service always
    sets a customer). The task reviewer independently confirmed — by reading
    `BookingManagementService.create()` — that no code path creates
    guest-only bookings yet, so a known, flagged issue
    (`BookingManagementService.complete()`/`toResponse()` and
    `AdminService.bookingMap()` would NPE on `booking.getCustomer()` for a
    guest-only booking) is genuinely unreachable today and correctly left
    unfixed as out of this task's scope — it belongs to whichever later
    phase first creates guest bookings.
11. `BaySeeder` — an idempotent `CommandLineRunner` `@Component` (matching
    the existing `SystemAccountSeeder` pattern) that seeds 2 QUICK + 1
    DETAIL + 1 UNIVERSAL bays (codes Q1/Q2/D1/U1) for every branch that has
    none yet, per BR-029. Proven both by a Mockito unit test (exact 4-bay
    type-ordered insert; zero inserts for an already-seeded branch) and by
    live evidence (see below).
12. Full-suite verification, live SQL Server evidence, and this evidence
    record (this task).

Relevant commits (chronological):

`1139569`, `2433aa2`, `9801311`, `e75e929`, `76f7314`, `6169a6a`,
`26884a3`, `53bce7b`, `f258ce5`, `89e58f5` (Task 9), `84657bc` (Task 10),
`c5f40d0` (Task 11).

## Files created/modified across Phase 1

- `Back-end/database/FR004v2_booking_engine_schema_migration.sql` (new)
- `Back-end/src/main/resources/application-test.properties` (new)
- `Back-end/src/test/java/com/autowashpro/repository/RepositoryIntegrationTest.java` (new)
- `Back-end/src/test/java/com/autowashpro/repository/BookingTestFixtures.java` (new)
- `Back-end/src/main/java/com/autowashpro/entity/{Guest,Bay,SlotReservation,BookingItem,Payment,IdempotencyRecord,AuditLog}.java` (new, one per table)
- `Back-end/src/main/java/com/autowashpro/repository/{Guest,Bay,SlotReservation,BookingItem,Payment,IdempotencyRecord,AuditLog}Repository.java` (new, one per entity)
- `Back-end/src/test/java/com/autowashpro/repository/{Guest,Bay,SlotReservation,BookingItem,Payment,IdempotencyRecord,AuditLog}RepositoryTest.java` (new, one per repository)
- `Back-end/src/main/java/com/autowashpro/entity/Booking.java` (modified — nullable `customer`, new `guest` field)
- `Back-end/src/test/java/com/autowashpro/repository/BookingGuestSupportTest.java` (new)
- `Back-end/src/main/java/com/autowashpro/config/BaySeeder.java` (new)
- `Back-end/src/test/java/com/autowashpro/config/BaySeederTest.java` (new)

## Verification evidence (Task 12)

**Full test suite**: `mvn -f Back-end/pom.xml test` — `BUILD SUCCESS`,
**26 tests run, 0 failures, 0 errors, 0 skipped**. Breakdown: 13
pre-existing (`AuthServiceImplTest` 7, `VehicleServiceImplTest` 3,
`GlobalExceptionHandlerTest` 1, `BookingManagementServiceTest` 2) + 13 new
from this plan (`GuestRepositoryTest` 2, `BayRepositoryTest` 1,
`SlotReservationRepositoryTest` 1, `BookingItemRepositoryTest` 1,
`PaymentRepositoryTest` 1, `IdempotencyRecordRepositoryTest` 1,
`AuditLogRepositoryTest` 1, `BookingGuestSupportTest` 3, `BaySeederTest` 2).
Correction to the plan document itself: its Task 12 text claimed "14 new
tests / 27 total," but its own per-file breakdown lists items summing to 13,
not 14 — 26 is the actual, correct, verified total; the plan's arithmetic
was wrong, not the implementation.

**Live SQL Server schema check** (both databases): `sys.tables` confirms all
7 new tables (`guests`, `bays`, `slot_reservations`, `booking_items`,
`payments`, `idempotency_records`, `audit_logs`) exist on both `autowash_pro`
and `autowash_pro_test`.

**Live application-boot evidence** (not code-reading or unit tests alone):
the real Spring Boot app was started once against the real `autowash_pro`
dev database (`mvn -f Back-end/pom.xml spring-boot:run`, default profile).
It started cleanly in 4.57s, Hibernate connected via HikariCP, and the
Hibernate SQL log shows `BaySeeder` running for real: for each of the 2
existing branches, one `SELECT` (idempotency check) followed by 4 `INSERT
INTO bays` statements. A direct `sqlcmd` query immediately after confirmed
exactly 8 rows in `bays`:

```
branch_id  bay_code  bay_type
1          D1        DETAIL
1          Q1        QUICK
1          Q2        QUICK
1          U1        UNIVERSAL
2          D1        DETAIL
2          Q1        QUICK
2          Q2        QUICK
2          U1        UNIVERSAL
```

This is the exact 2-QUICK/1-DETAIL/1-UNIVERSAL-per-branch composition BR-029
requires. `slot_reservations` row count is 0 (expected — nothing in Phase 1
creates a reservation). The process was then stopped
(`taskkill /PID <pid> /F`) to leave a clean local state; the app was not left
running. `autowash_pro_test`'s `bays` count is 0, as expected — `@DataJpaTest`
rolls every test back, so nothing persists there outside the tests
themselves.

## Independent review summary (Tasks 9–12)

Each of Tasks 9–11 went through a fresh implementer subagent (TDD RED/GREEN,
self-review, no commit) followed by an independent task-reviewer subagent
(spec compliance + code quality verdicts, cross-checked against the real
migration DDL and existing codebase files, not just the brief). All three
reviews returned **Approved** with **no Critical or Important findings**.
Minor notes (all confirmed non-blocking, several confirmed correct-not-a-defect
on inspection): `AuditLog.id`'s column naming (correct per the real schema);
`BookingGuestSupportTest`'s slightly indirect customer-then-null-override
setup (inherited from the brief, not an implementer artifact); `BaySeeder`
test coverage limited to single-branch scenarios (loop independence verified
by manual code reading instead) and no DB-level idempotency integration test
(a unit test was what the brief specified); `BaySeeder`'s verbosity relative
to `SystemAccountSeeder`'s terser style (inherited from the brief's own code).
The controller performed every `git add`/`git commit` itself, each scoped to
an explicit pathspec naming only that task's files, consistent with the
mitigation adopted after the Tasks 1–2 incident described below.

## Important incident and safeguards

One commit attempt accidentally included the unrelated pre-existing staged
pile because `git commit` was not given a pathspec. It was corrected safely
with a soft reset before anything was pushed, and the intended task files were
then committed separately. Future commits must explicitly scope the commit
pathspec; never reset or discard unrelated work. This mitigation held for the
remainder of Phase 1 (Tasks 3–11): the controller performed every commit
itself with an explicit pathspec, and `git show --stat` was checked after
each to confirm only the intended files landed.

An implementer also found that the shared SQL Server customer fixture needed a
unique non-null email. That was corrected because SQL Server unique-column NULL
behavior could otherwise cause a false failure before the intended bay-slot
constraint was reached.

A separate minor incident during Task 9: the implementer's report initially
included the real `DB_PASSWORD` value in plaintext. The report file lives
under `.superpowers/sdd/`, which is git-ignored (confirmed via `git
check-ignore`), so it was never staged or committed — but the controller
redacted the value on sight as a precaution, and later task dispatches were
given an explicit instruction not to echo the password value at all.

## Known follow-up for later phases (not a Phase 1 defect)

`BookingManagementService.complete()` (reads `booking.getCustomer().getTier()`),
`BookingManagementService.toResponse()` (reads `customerId`/`customerName`/
`customerPhone` off `getCustomer()` — already anticipated by the plan as a
Phase 3 dependent), and `AdminService.bookingMap()` (reads
`getCustomer().getFullName()`) all assume `Booking.customer` is non-null and
will NPE if ever called against a guest-only booking. Confirmed unreachable
today (no code path creates guest bookings pre-Phase-2). Whichever phase
first implements guest-booking creation must also update these three call
sites to branch on customer-vs-guest.

## Scope boundary held throughout Phase 1

No `tiers` table, no `services`/`branches` pricing or duration/buffer
columns, no `bay_id` column added to `bookings` (bay assignment is
represented solely via `slot_reservations.bay_id`), and no business logic
(OTP, slot/bay allocation, pricing, VNPAY, RBAC state machine, scheduled
jobs) — all deferred to later phases, each requiring its own plan.

## Evidence status

This log now records Phase 1 as fully implemented, committed, and reviewed,
with live SQL Server evidence for both the schema and the `BaySeeder`
behavior. **Do not claim the Backend + Swagger gate has passed** — Phase 1
was schema/entity/repository-only by design. Full HTTP integration tests,
concurrency tests, OTP tests, VNPAY tests, OpenAPI contract checks, live API
verification, and the final gate evidence remain outstanding in later
phases (Phase 2 onward), each requiring its own plan before implementation
starts.
