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
A dedicated security pass then found three further High risks: guest replay
after proof-row cleanup, public idempotency storage amplification, and expired
physical HOLD rows being advertised free. The frozen design below adds proof-
digest guest scopes, bounded pre-database quotas/cleanup, and treats a HOLD as
capacity-blocking until lifecycle expiry atomically deletes it.

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
Authentication is an explicit XOR: a valid CUSTOMER bearer uses the member
shape and must not also submit a proof; STAFF/ADMIN never downgrade to guest;
malformed, non-Bearer, or invalid Authorization is `401`, not anonymous fallback.

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
   bean. A member scope is its signed customer subject. A guest principal scope
   is `SHA-256("GUEST|" + normalizedVerifiedPhone)`, derived only from a valid
   proof row and never from the request phone. The separately stored proof hash
   is domain-separated `SHA-256("GUEST_BOOKING:" + proof)`; proof syntax is
   validated before hashing. The raw idempotency key is likewise stored only as
   `client_key_hash`. A unique `(path, principal_scope_hash, client_key_hash)`
   prevents a newly issued proof for the same verified phone from creating a
   second result for the same key. An existing completed record accepts the
   exact original proof by constant-time stored-digest equality even after
   proof-row cleanup. A different proof must still be live, unconsumed,
   correct-purpose, and bound to that same verified phone before it is durably
   consumed and the existing result returned. Missing, random, wrong-phone,
   wrong-purpose, expired, or consumed proofs neither reveal record existence
   nor claim a new key.
2. Exact previously consumed proof replays are located through the unique
   `idempotency_guest_proofs` association using proof digest, client-key digest,
   and path; the immutable unexpired record may return its stored status,
   `Location`, `Cache-Control`, and body without a proof row. For a new or
   substitute proof, a short read verifies a live unconsumed `GUEST_BOOKING`
   proof, derives the verified-phone scope, and performs a preliminary existing-
   record/request-digest check without exposing whether another actor owns a key.
3. Before any idempotency database mutation, a bounded cache limiter applies a
   10-per-15-minute principal quota to members and both a 20-per-15-minute
   origin quota and 600-per-minute process-global quota to anonymous callers; a
   valid inspected proof also receives a 5-per-15-minute proof-digest quota. Every
   cache has maximum entries plus expiry eviction. Invalid/high-cardinality
   attacker tokens can consume only bounded origin/global budget and never
   create proof-keyed cache or idempotency rows. A scheduled indexed cleanup
   deletes at most 5,000 expired records per minute, including guest-phone PII;
   capacity tests compare admitted write rate with this drain rate.
4. The facade invokes the dedicated lifecycle-expiry service for expired
   reservations overlapping the requested branch/day. That service commits its
   complete booking/payment/voucher/reservation/audit transition independently;
   creation never mutates or rolls back unrelated users' expiry work.
5. All non-mutating validation runs before a guest proof is consumed: active
   branch, configured active catalog, mode, quantities, start/window/advance,
   member vehicle ownership or guest payload, voucher ownership/tier/state,
   trusted price/duration, and preliminary availability.
6. After those preliminary checks and before opening the outer booking
   transaction, the facade durably consumes a new/substitute guest proof through
   the separate `REQUIRES_NEW` service. Because no outer connection or lock is
   held, this cannot exhaust the pool through nested transactions. If a
   concurrently inspected proof loses the conditional consume, the loser polls
   only the exact `(proof digest, client-key digest, path)` association outside
   any transaction for at most seven seconds. It reads immediately, then backs
   off at 50, 100, 200, and 250 ms capped intervals; every query is capped at the
   lesser of 500 ms or the remaining deadline, and no connection is held while
   waiting. Once the winner commits, an unexpired guest record matching the
   proof-derived phone/principal scope and client key/path returns its exact
   stored response when the request digest also matches, or `409` when only the
   request digest differs. A different key/path/principal/phone, a winner
   rollback, or a timeout returns only the generic proof error and reveals no
   competing record. Polling is permitted only after this request observed the
   same proof as live and then lost its conditional consume; random or initially
   consumed proofs fail immediately. A later race, lock failure, or booking rollback
   otherwise intentionally burns the proof and requires a new OTP; authorization
   is never restored. The original or substitute proof is associated with
   exactly one completed idempotency result in the outer transaction. If that
   transaction fails, no association/result exists and the burnt proof cannot be
   reused.
7. The outer transaction performs a native primary-key lookup with
   `UPDLOCK,HOLDLOCK` on the scoped idempotency digest. The PK key-range lock
   serializes an existing row or missing-key gap across instances without an
   incomplete claim row or attacker-controlled in-memory keys. An unexpired
   same-request record gets the newly consumed proof association and returns the
   exact stored response; a different digest returns `409`. An expired record is
   deleted under that same sargable range lock before replacement is allowed.
8. Availability and allocation treat every physical HOLD row as blocking,
   regardless of its timestamp. Only the committed lifecycle-expiry transaction
   makes capacity free by changing the booking, voucher, HOLDs, and audit
   together. POST invokes bounded targeted expiry before its locked capacity
   recheck; GET may conservatively lag until the minute job rather than
   advertise a row that `UX_bay_slot` would reject.
9. The allocator acquires a transaction-owned SQL Server `sp_getapplock` keyed
   by branch and Vietnam business date, re-reads blocking reservations, selects
   specialized bays before UNIVERSAL, and chooses one bay free for every
   consecutive cell. The coarse per-branch/day lock is an intentional,
   low-scale correctness tradeoff; `UX_bay_slot` remains final authority.
   Its lock wait is capped at two seconds. Every `sp_getapplock` return code below zero (timeout, cancellation,
   deadlock-victim, or parameter/call failure) aborts before capacity reads or
   writes; allocation never proceeds without a confirmed transaction-owned lock.
   Flexible bookings do not create hard reservations.
10. The post-proof publication transaction has a hard five-second timeout, so
    the seven-second loser poll budget always exceeds its maximum duration plus
    commit-visibility margin. Booking, optional guest/inline vehicle, booking-item snapshots, legacy
    booking-service links, voucher `ACTIVE -> LOCKED`, HOLD rows, a non-PII audit
    row, the completed idempotency response, and its unique proof association are
    written in one transaction.
    Voucher acquisition uses a pessimistic row lock followed by a conditional
    `ACTIVE`/unowned to `LOCKED`/this-booking update with affected-row count one;
    release/use operations condition on that same `locked_booking_id`.
    `UX_bay_slot` remains final conflict authority. The outer facade translates
    only SQL Server 2601/2627 violations naming `UX_bay_slot`, after the failed
    transaction has fully rolled back, to `409` and recomputes alternatives in
    a fresh read transaction. Other integrity failures remain server errors.
11. A minute job locks due booking rows and atomically performs
   `PENDING_DEPOSIT -> EXPIRED`, deletes only their HOLD rows, changes their
   still-LOCKED voucher back to ACTIVE, and writes one SYSTEM audit row.
    Future IPN verifies signature and amount before its mutation transaction,
    performs immutable payment-to-booking lookup, then locks booking before
    payment. Confirmation atomically marks payment SUCCESS and booking CONFIRMED,
    changes every HOLD to BOOKED, and clears reservation/deposit expiry. Expiry
    checks for SUCCESS while holding the same booking lock. Confirmation wins
    only when the verified callback is processed at `now < deposit_expires_at`;
    equality belongs to expiry. A verified late IPN
    for EXPIRED never revives capacity and enters reconciliation/refund handling.

Creation lock order is fixed as durable proof consume before the outer
transaction (guest only), then idempotency key range -> customer or guest-phone
hash range -> branch/day allocation app lock -> voucher ->
booking/item/reservation/audit/idempotency/proof-association inserts. Member and
guest paths never acquire both voucher and proof locks. All later allocation paths
must take the branch/day lock before voucher or reservation mutation. Expiry and
IPN use the identical booking -> payment -> voucher -> reservations -> audit
order, including the exact expiry-boundary race.

## Database additions

Create one additive/idempotent Phase 3C migration and apply it twice to both
databases after preflight audits:

- persisted computed active-customer and active-guest guard columns plus
  unfiltered unique indexes. Each guard exposes the positive owner ID for
  BR-012's exact active states and otherwise the booking's unique negative ID,
  avoiding SQL Server's prohibition on computed columns in filtered-index
  predicates. Applying the guest
  guard is an autonomous integrity assumption: BR-012's sample SQL names
  customers, while the approved guest flow also requires the active-booking
  rule. The migration rejects non-positive booking/customer/guest IDs so active
  positive owner IDs cannot collide with inactive negative booking sentinels;
- booking status and pending-expiry constraints, an `assigned_bay_id`, and
  booking/branch/bay referential consistency for non-legacy SLOT rows;
- booking-item quantity/money/duration checks and unique booking/service pair;
- voucher `locked_booking_id` ownership and exact ACTIVE/LOCKED/USED state
  consistency, including clearing the owner on release/use;
- a `client_key_hash`, initial `guest_proof_hash`, request/principal digests,
  actor-XOR, actor/key and replay indexes, plus an enforced greater-than-zero and
  at-most-24-hour idempotency TTL. A cascading `idempotency_guest_proofs` table
  gives every consumed original/substitute proof a unique one-result association;
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
and rollback with no orphan rows. Owner-scoped missing and foreign vehicle or
voucher identifiers use indistinguishable `404` responses. Implement the
command/transaction services.

### Task 5 — capacity and idempotency concurrency

Use real committed SQL Server fixtures and two executor threads. Prove one-bay
same-cell contention yields exactly one create and one `SLOT_UNAVAILABLE`; two
bays allow two bookings; an expired HOLD is reclaimable; an unexpired HOLD is
not; exact same-key concurrency produces one booking and two identical
responses; same key/different body creates one booking and one conflict; and
different principals may reuse the raw key. Also cover overlapping intervals,
QUICK/DETAIL contention for UNIVERSAL, same-phone/different-proof guest upsert,
same-customer inline-plate creation, bounded allocation-lock timeout, and no
unhandled SQL Server deadlock 1205. Add two-thread conditional voucher
 acquisition proving exactly one booking can lock a voucher, and proof rollback,
 same-proof/same-key concurrent loser polling to the identical response,
 cross-key reuse, substituted-proof replay, and expired-idempotency replacement.

### Task 6 — HTTP/security/OpenAPI

Add MockMvc integration tests for anonymous proof, member JWT subject, invalid
bearer, missing proof, lookup-purpose proof, STAFF/ADMIN denial, unknown input
fields, validation/error shapes, `Location`, no-store, exact replay, slot
alternatives, bounded principal/origin/global throttling, high-cardinality
invalid-proof churn, and absence of sensitive fields. Replace only the
legacy create method; preserve existing read/lookup routes. Add OpenAPI tests
for explicit CUSTOMER-bearer OR guest-proof security, required idempotency and
conditional proof headers with examples, DTO field exclusion, documented
statuses, UTC examples, and conflict schema.

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
