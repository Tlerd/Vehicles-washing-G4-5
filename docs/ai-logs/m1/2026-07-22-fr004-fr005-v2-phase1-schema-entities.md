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

The following tasks are complete, committed, and independently reviewed:

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

Relevant commits:

`1139569`, `2433aa2`, `9801311`, `e75e929`, `76f7314`, `6169a6a`,
`26884a3`, `53bce7b`, `f258ce5`.

## Current checkpoint

Work is paused immediately before Task 9. The next task is:

- Implement and test `AuditLog` entity and repository.

Then complete:

- Task 10: evolve the `Booking` entity to support exactly one customer or
  guest, matching the migration and existing JPA conventions.
- Task 11: add an idempotent `BaySeeder` with 2 QUICK, 1 DETAIL, and 1
  UNIVERSAL bay for every branch.
- Task 12: run sequential Maven tests, verify against SQL Server, perform the
  final Phase 1 review, and record actual evidence in `PROGRESS.md` and this
  AI-log directory.

## Important incident and safeguards

One commit attempt accidentally included the unrelated pre-existing staged
pile because `git commit` was not given a pathspec. It was corrected safely
with a soft reset before anything was pushed, and the intended task files were
then committed separately. Future commits must explicitly scope the commit
pathspec; never reset or discard unrelated work.

An implementer also found that the shared SQL Server customer fixture needed a
unique non-null email. That was corrected because SQL Server unique-column NULL
behavior could otherwise cause a false failure before the intended bay-slot
constraint was reached.

## Evidence status

This log records implementation progress and reviewed commits only. Do not
claim the Backend + Swagger gate has passed yet. Full HTTP integration tests,
concurrency tests, OTP tests, VNPAY tests, OpenAPI contract checks, live API
verification, and final gate evidence remain outstanding in later phases.
