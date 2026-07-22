# FR-004/FR-005 Phase 3C — transactional booking creation

Status: adversarially reviewed; no unresolved Critical or High findings
Date: 2026-07-22
Base commits: `7543192`, `4d01472`

Review disposition: the initial adversarial review found four High risks in
guest cached-replay authorization, allocation-lock ambiguity, unrelated expiry
inside creation, and future IPN/expiry state coupling. The plan now binds guest
scope to the stored proof, uses a branch/day SQL application lock, commits
lifecycle expiry separately, and specifies the shared booking/payment lock and
state rules. The independent post-fix review found no remaining Critical or
High findings.

## Goal and boundary

Replace the legacy member-only `POST /api/v1/bookings` implementation with one
principal-derived v2 command that creates member or verified-guest bookings,
trusted item/price snapshots, voucher locks, deterministic same-bay HOLD rows,
an audit row, and a 24-hour idempotency replay record atomically. Couple expired
HOLD release to an atomic `PENDING_DEPOSIT -> EXPIRED` lifecycle transition.

This phase does not fabricate a VNPAY URL. `paymentUrl` remains nullable until
the next payment phase supplies a signed provider URL. The booking and HOLD are
otherwise real and become the sole input to that phase.

## Frozen contract

`POST /api/v1/bookings`

Headers:

- `Idempotency-Key` is required (8-128 visible ASCII characters).
- A member supplies a valid CUSTOMER bearer token.
- A guest supplies no bearer token and supplies a single-use
  `X-Guest-Verification-Proof` with purpose `GUEST_BOOKING` bound to the request
  phone. An invalid explicit bearer token never falls back to guest mode.
- STAFF and ADMIN bearers receive `403`.

Canonical request:

```json
{
  "branchId": 1,
  "startAt": "2026-07-25T03:00:00Z",
  "items": [{ "serviceId": 1, "quantity": 1 }],
  "vehicleId": 71,
  "newVehicle": null,
  "guest": null,
  "guestVehicle": null,
  "voucherId": null,
  "note": "Xe mới đi mưa"
}
```

Member requests require exactly one of `vehicleId` or `newVehicle`, prohibit
guest fields, and derive customer ownership from the JWT subject. Guest
requests require `guest` and `guestVehicle`, prohibit both member vehicle forms
and vouchers, and never create a saved vehicle. Client identity, role, status,
price, payment state, duration, and booking state are not accepted.

`201 Created` returns `Location: /api/v1/bookings/{bookingRef}`,
`Cache-Control: no-store`, the reference, immutable pricing, and any UTC deposit
expiry. A positive deposit produces `PENDING_DEPOSIT`; a server-owned zero-
deposit waiver produces immediate `CONFIRMED` with BOOKED reservations and no
expiry. An exact replay returns the same status, headers, and body. `paymentUrl`
is nullable in Phase 3C.

Document `201/400/401/403/404/409/429`. Slot races use code
`SLOT_UNAVAILABLE` and include up to three selectable UTC alternatives. A
same-key/different-request replay uses `IDEMPOTENCY_CONFLICT`. No response or
log exposes raw proof or idempotency material.

## Transaction architecture

1. A non-transactional command facade validates header/body/auth shape,
   normalizes non-secret actor data, and delegates to a separate transaction
   bean. For a guest it first validates proof format, loads the proof by digest,
   verifies the stored phone and `GUEST_BOOKING` purpose, and derives scope only
   from that stored phone. A consumed proof can authorize only retrieval of an
   existing exact idempotency result; a new command still requires a successful
   atomic consumption update. Random or wrong-purpose proofs never reach another
   guest's cached result.
2. The transaction performs a native primary-key lookup with
   `UPDLOCK,HOLDLOCK` on the scoped idempotency digest. The PK key-range lock
   serializes an existing row or missing-key gap across instances without an
   incomplete claim row or attacker-controlled in-memory keys.
3. Under the lock, an unexpired record with the same request digest returns the
   stored response before proof consumption. A different digest returns `409`.
4. The facade first invokes the dedicated lifecycle-expiry service for expired
   reservations overlapping the requested branch/day. That service commits its
   complete booking/payment/voucher/reservation/audit transition independently;
   creation never mutates or rolls back unrelated users' expiry work.
5. All non-mutating validation runs before a guest proof is consumed: active
   branch, configured active catalog, mode, quantities, start/window/advance,
   member vehicle ownership or guest payload, voucher ownership/tier/state,
   trusted price/duration, and preliminary availability.
6. The allocator acquires a transaction-owned SQL Server `sp_getapplock` keyed
   by branch and Vietnam business date, re-reads blocking reservations, selects
   specialized bays before UNIVERSAL, and chooses one bay free for every
   consecutive cell. The coarse per-branch/day lock is an intentional,
   low-scale correctness tradeoff; `UX_bay_slot` remains final authority.
   Flexible bookings do not create hard reservations.
7. Only after the locked re-check succeeds does a guest proof get consumed via
   a new conditional REQUIRED/MANDATORY booking-consumption method. Lookup proof
   consumption remains `REQUIRES_NEW`, but booking proof consumption commits or
   rolls back with booking creation. This proves single use for every committed
   booking while preserving retry after a fully rolled-back attempt.
8. Booking, optional guest/inline vehicle, booking-item snapshots, legacy
   booking-service links, voucher `ACTIVE -> LOCKED`, HOLD rows, a non-PII audit
   row, and the completed idempotency response are written in one transaction.
   `UX_bay_slot` remains final conflict authority. The outer facade translates
   a rolled-back slot uniqueness race to `409` and recomputes alternatives in a
   fresh read transaction.
9. A minute job locks due booking rows and atomically performs
   `PENDING_DEPOSIT -> EXPIRED`, deletes only their HOLD rows, changes their
   still-LOCKED voucher back to ACTIVE, and writes one SYSTEM audit row.
   Future IPN verifies signature and amount before its mutation transaction,
   performs immutable payment-to-booking lookup, then locks booking before
   payment. Confirmation atomically marks payment SUCCESS and booking CONFIRMED,
   changes every HOLD to BOOKED, and clears reservation/deposit expiry. Expiry
   checks for SUCCESS while holding the same booking lock. A verified late IPN
   for EXPIRED never revives capacity and enters reconciliation/refund handling.

Creation lock order is fixed as idempotency key range -> customer or guest-phone
range -> branch/day allocation app lock -> voucher -> booking-proof update ->
booking/item/reservation/audit/idempotency inserts. All later allocation paths
must take the branch/day lock before voucher or reservation mutation. Expiry and
IPN use booking -> payment -> voucher -> reservations -> audit.

## Database additions

Create one additive/idempotent Phase 3C migration and apply it twice to both
databases after preflight audits:

- persisted computed active-customer and active-guest guard columns plus
  filtered unique indexes for BR-012's exact active states. Applying the guest
  guard is an autonomous integrity assumption: BR-012's sample SQL names
  customers, while the approved guest flow also requires the active-booking
  rule;
- booking status and pending-expiry constraints, an `assigned_bay_id`, and
  booking/branch/bay referential consistency for non-legacy SLOT rows;
- booking-item quantity/money/duration checks and unique booking/service pair;
- voucher `locked_booking_id` ownership and exact ACTIVE/LOCKED/USED state
  consistency, including clearing the owner on release/use;
- request/principal digest, actor-XOR, and idempotency expiry checks;
- supporting guest-phone, due-expiry, and ownership/allocation indexes only
  where not already present.

Backfill `assigned_bay_id` from complete single-bay reservations before adding
the assignment FK. Permit legacy `PENDING` only on explicitly marked legacy
snapshots; new rows use the approved lifecycle. No legacy row is deleted. Abort
and report if remaining existing data violates a new constraint.

Capture one injected `Clock` instant per command. API values are UTC Instants;
existing SQL `slot_time` and lifecycle `DATETIME2` values are Vietnam business
wall time derived once from that instant. Request hashing includes every
normalized semantic field but excludes proof material and the idempotency key.
Immediate `CONFIRMED` for a server-owned deposit waiver is a documented BR-014
exception required to make BR-017 waiver semantics executable; audit it as
`DEPOSIT_WAIVED`.

## RED-first implementation tasks

### Task 1 — schema and repository primitives

Write failing SQL Server tests for active-booking uniqueness, pending expiry,
booking-item invariants, idempotency digests, locked active-bay ordering,
voucher row locks, due-booking locks, idempotency missing-key range locks, and
branch/day allocation app-lock behavior. Include realistic legacy PENDING,
LOCKED-voucher, reservation, and idempotency upgrade fixtures. Add the migration,
entity/repository operations, rerun focused repository tests, then apply the
migration twice to both databases.

### Task 2 — request/actor/idempotency policy

Add DTO validation and pure tests for member/guest XOR, forbidden client-owned
fields, item caps/deduplication, normalized vehicle/guest input, key bounds,
stable request hashing, principal scoping, exact replay, mismatch, expiry, and
different-principal reuse. Store only digests and the minimized response.

### Task 3 — lifecycle-coupled expiry

Replace independent expired-HOLD deletion with the booking expiry service/job.
RED tests prove exact-boundary expiry, voucher release, HOLD deletion, one audit
row, idempotent rerun, BOOKED preservation, and rollback. Add a concurrency test
that models expiry versus a conditional confirmation transition; exactly one
state wins and no CONFIRMED booking loses BOOKED reservations.

### Task 4 — trusted member and guest transactions

Write service integration tests before implementation. Cover owner-derived
member creation, saved and inline vehicles, vehicle IDOR, guest create/update,
proof phone/purpose/replay, member-phone guest rejection after merge, guest
voucher prohibition, voucher owner/tier/expiry/state locks, immutable item and
price snapshots, active-booking conflicts, flexible bookings without holds,
and rollback with no orphan rows. Implement the command/transaction services.

### Task 5 — capacity and idempotency concurrency

Use real committed SQL Server fixtures and two executor threads. Prove one-bay
same-cell contention yields exactly one create and one `SLOT_UNAVAILABLE`; two
bays allow two bookings; an expired HOLD is reclaimable; an unexpired HOLD is
not; exact same-key concurrency produces one booking and two identical
responses; same key/different body creates one booking and one conflict; and
different principals may reuse the raw key. Also cover overlapping intervals,
QUICK/DETAIL contention for UNIVERSAL, same-phone/different-proof guest upsert,
same-customer inline-plate creation, bounded allocation-lock timeout, and no
unhandled SQL Server deadlock 1205.

### Task 6 — HTTP/security/OpenAPI

Add MockMvc integration tests for anonymous proof, member JWT subject, invalid
bearer, missing proof, lookup-purpose proof, STAFF/ADMIN denial, unknown input
fields, validation/error shapes, `Location`, no-store, exact replay, slot
alternatives, throttling, and absence of sensitive fields. Replace only the
legacy create method; preserve existing read/lookup routes. Add OpenAPI tests
for the OR security schemes, required idempotency header, DTO field exclusion,
documented statuses, UTC examples, and conflict schema.

### Task 7 — phase verification and review

Run the smallest relevant tests, the new creation/security/concurrency group,
then `& Back-end/run-tests.ps1 -Clean`. Perform independent code and adversarial
security reviews, fix every Critical/High and correctness/security Medium,
rerun the clean suite, update the SDD ledger/PROGRESS/AI log, and commit code and
documentation separately with explicit pathspecs.

## Required evidence

- Non-zero focused, HTTP/security, transaction, and real concurrency counts.
- Clean full backend count against `autowash_pro_test`.
- Migration preflight, first execution, and idempotent repeat for both DBs.
- A row-level assertion that failed transactions leave no booking/item/HOLD,
  voucher lock, audit, or idempotency record.
- Independent reviews with no unresolved Critical or High findings.
- Explicit residual: live VNPAY remains for the next phase; no frontend work
  starts until that and the rest of the Backend + Swagger gate pass.
