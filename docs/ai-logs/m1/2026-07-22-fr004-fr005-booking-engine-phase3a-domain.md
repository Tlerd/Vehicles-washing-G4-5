# AI log — FR-004/FR-005 booking-engine Phase 3A domain foundation

- Date: 2026-07-22
- Branch: `chore/harness-setup`
- Commit: `bff3ab0`
- Scope: establish the trusted SQL Server/JPA domain required before pricing,
  availability, transactional booking creation, or payment work.

## Requirements and autonomous decisions

- Followed the current mission, FR-004/FR-005, business rules BR-001, BR-012,
  BR-016, BR-017, BR-021, BR-022, BR-029, and BR-030, plus the approved service
  catalog. The original lecturer rubric was unavailable.
- Existing `Vehicle.brand` remains the combined brand/model field used by the
  approved FR-003 contract and current API. A guest booking stores an immutable
  plate, combined brand/model, and size snapshot without creating a member
  vehicle.
- `min_tier_id` is authoritative. The transitional `min_tier` value is
  read-only in JPA and cleared after migration.
- Historical financial fields are not fabricated. Existing rows are marked
  `legacy_financial_snapshot=true`; new JPA rows explicitly write `false`.
- A valid-looking raw 64-hex legacy idempotency key cannot be distinguished
  from a digest. This was accepted only after read-only evidence showed zero
  idempotency rows in both databases.
- The ten existing service codes were aligned to the approved catalog. Adding
  the remaining catalog entries is separate catalog-administration scope; an
  unknown/unconfigured service remains non-bookable.

## Delivered

- Idempotent transactional migration runner that loads ignored environment
  configuration without printing secrets and fails on SQL Server batch errors.
- Trusted service pricing, unit, mode, buffer, bay type, and booking-enabled
  metadata; approved snapshots for `wc1`–`wc5` and `ic1`–`ic5`.
- Data-driven Member/Silver/Gold/Platinum policy with rank, booking window,
  points multiplier, and deposit waiver.
- Branch booking policy; immutable booking financial and guest vehicle fields;
  guest/member actor invariants; vehicle-owner and bay-branch composite foreign
  keys; trusted financial arithmetic checks; and expiry/read indexes.
- Guest rows no longer require a synthetic member vehicle. Legacy guest rows
  are safely snapshotted before the old vehicle reference is cleared.
- Scoped/request idempotency hashes with a trusted 64-hex constraint; raw keys
  are not used as repository IDs.
- Immutable guest lookup projections, guest-safe staff/admin mapping, and
  removal of customer loyalty mass assignment.

## TDD and migration evidence

- Initial schema RED: `BookingEngineSchemaIntegrationTest` failed on missing
  trusted booking columns.
- Initial compatibility RED: `BookingGuestSupportTest` and
  `IdempotencyRecordRepositoryTest` failed under the stronger database
  invariants.
- Catalog RED: `BookingEngineDomainRepositoryTest` observed the old catalog
  duration/price snapshots before the approved values were migrated.
- Snapshot RED: `GuestBookingLookupHttpIntegrationTest` proved lookup returned
  a later-mutated guest plate/size instead of the immutable booking snapshot.
- A development migration attempt failed on a fresh-schema batch reference to
  `guests.vehicle_brand`; the transaction rolled back, a required batch
  boundary/addition was introduced, and the same migration then succeeded.
- Test DB migration command, run successfully twice:
  `& Back-end/run-migration.ps1 -Migration 'database/FR004v2_phase3_booking_creation_migration.sql' -Databases @('autowash_pro_test')`.
- Development DB migration command, run successfully twice:
  `& Back-end/run-migration.ps1 -Migration 'database/FR004v2_phase3_booking_creation_migration.sql' -Databases @('autowash_pro')`.
- Final clean backend command: `& Back-end/run-tests.ps1 -Clean` — BUILD
  SUCCESS, **108/108**, 0 failures, 0 errors, 0 skipped.
- Read-only database evidence:
  `autowash_pro|idempotency=0|legacyFinancial=6|guestBookings=0` and
  `autowash_pro_test|idempotency=0|legacyFinancial=0|guestBookings=0`.

## Review findings and disposition

The first independent review found three High issues: no legacy guest-row
upgrade, future legacy bookings being invisible to a slot-only engine, and
mass-assignable loyalty fields. Guest backfill and loyalty authority were
fixed. The availability compatibility item is explicitly binding on Phase 3B:
reads must conservatively consider active legacy bookings until equivalent
reservations exist. The post-fix review found no unresolved Critical or High
finding in this phase.

Medium findings fixed: canonical voucher-tier source, explicit legacy
financial marker, trusted hashed-key constraint, Tier creation timestamp,
trusted/enabled FK assertions, and rejection of the broken non-SRS direct
customer-creation path in favor of verified registration.

## External and human validation

- SQL Server was available and both local databases were migrated and queried.
- No live Firebase, VNPAY, notification, or browser dependency applies to this
  schema/domain-only checkpoint.
- Human validation has not yet been reported.

## Traceability impact

- FR-004: PARTIAL — trusted catalog, pricing snapshots, tier policy, guest
  ownership, branch policy, and capacity schema are ready; calculation,
  availability, creation, and holds remain.
- FR-005: PARTIAL — deposit/paid/counter/expiry snapshots and arithmetic are
  ready; VNPAY and payment lifecycle remain.
- FR-006/FR-007/FR-008: PARTIAL — tier policy and voucher eligibility are now
  data-backed, but lifecycle jobs and audited transactions remain.
- FR-010/FR-012: PARTIAL — guest-safe projections and legacy-financial markers
  prevent null/crash and false-payment assumptions; full admin APIs remain.

The Backend + Swagger gate has not passed.
