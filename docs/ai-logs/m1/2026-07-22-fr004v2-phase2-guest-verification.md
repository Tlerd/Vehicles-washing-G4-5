# AI Log — FR-004/FR-005 v2 Backend Phase 2: Guest Identity & OTP/Firebase Verification-Proof Foundation

## Purpose

Record the implementation of Phase 2 of the owner-approved backend-first
FR-004/FR-005 v2 plan, so a later agent can continue without repeating
completed work. Scope: server-side guest-identity verification-proof
foundation only. Guest booking creation, the real HTTP endpoints, VNPAY,
slot allocation, RBAC/Swagger completion, and frontend work are all
deferred to later phases, each requiring its own plan.

## Phase 2 objective

Implement the secure backend primitives that guest booking creation and
guest booking lookup will depend on in a later phase: server-side Firebase
identity verification that never trusts a client `otpVerified` flag, a
short-lived/single-use/purpose-bound/phone-bound verification proof
persisted in SQL Server, deterministic rate limiting, and a tested
authorization primitive for a future guest booking-lookup endpoint.

## Pre-implementation process

Given this phase's security sensitivity, the process was heavier than
Phase 1's:

1. **Parallel investigation (4 agents)** established the actual current
   state of the codebase before any plan was drafted: `FirebaseTokenVerifier`
   / `VerifiedFirebaseIdentity` already exist as a clean seam (used today
   only by `AuthServiceImpl.register()`); `PhoneNormalizer.toE164` already
   exists and is called at 2 of BR-015's 3 required sites (register, login
   — never at any OTP path, since none existed); `SendOtpRequest`/
   `VerifyOtpRequest` are confirmed genuinely dead (zero references
   anywhere); no rate-limiting code exists anywhere in the backend; no
   booking-lookup-by-reference endpoint exists; `SecurityConfig`'s matcher
   rules were read in full.
2. **A planner drafted the full 10-task plan** against that ground truth,
   modeled on Phase 1's plan structure and freezing every contract element
   the owner's brief required (proof storage, TTL, format, purpose enum,
   atomicity mechanism, rate-limit keys, error envelope, migration
   strategy, exact tests).
3. **3 parallel adversarial reviewers** (JPA/Hibernate correctness,
   security design, test-coverage completeness) reviewed the *draft plan
   itself* — before any code was written — and found real, fixable
   problems (see "Pre-implementation fixes" below). All were fixed in the
   plan document before Task 1 was dispatched.
4. **Implementation** followed the same fresh-implementer +
   independent-task-reviewer loop as Phase 1, one task at a time, with the
   controller performing every `git add`/`git commit` itself using an
   explicit pathspec.

Final plan: `docs/superpowers/plans/2026-07-22-fr004v2-phase2-guest-verification.md`
(10 tasks — Task 10 is this evidence-recording task).

## Pre-implementation fixes (found by adversarial review of the draft plan)

- **Critical (JPA)**: `PhoneVerificationProofRepository`'s `@Modifying`
  bulk-update queries lacked `clearAutomatically = true`. Without it, a
  same-transaction `findById()` after the bulk UPDATE (exactly what Task 3's
  own test does) returns a stale, already-managed entity instead of the
  fresh DB row — the test would have failed. Fixed before Task 1 started.
- **Critical (test coverage)**: `consumeIfValidForPurpose` — the query
  actually used by the lookup/IDOR path (Task 7/9) — had zero real-database
  test coverage planned, only mocked coverage from later tasks. Fixed: 2
  real-database tests added to Task 3
  (`consumeIfValidForPurpose_matchingUnexpiredUnconsumedProof_...`,
  `consumeIfValidForPurpose_wrongPurpose_...`).
- **Important (security)**: the draft's `issueProof` rate-limited on the
  caller's raw, unverified phone claim *before* calling Firebase
  verification — an attacker could exhaust a real victim's issuance quota
  using pure garbage tokens, no proof of phone ownership required. Fixed:
  reordered to verify Firebase first, then rate-limit on the *verified*
  phone. The same fix was extended to `consumeProofForPhone` (was
  phone-keyed, changed to token-keyed, matching the already-safe lookup
  path's design).
- **Important (security)**: `GuestBookingLookupAuthorizationServiceImpl.authorize()`
  has an undocumented invariant — it must never run inside an outer
  `@Transactional`, or a future caller could silently roll back the
  proof's single-use burn alongside a thrown 404/403, reopening
  replay/enumeration. Fixed: documented as a code comment + a Global
  Constraints section in the plan, and proven behaviorally by a new
  real-database integration test added to Task 9
  (`GuestBookingLookupAuthorizationIntegrationTest`).
- **Minor**: Task 4's concurrency test used `threadCount = 10`, matching
  HikariCP's unconfigured default pool size with no headroom — a false "1
  winner" result could have come from connection-pool serialization rather
  than the intended DB-level row-lock compare-and-swap. Fixed: explicit
  `spring.datasource.hikari.maximum-pool-size=20` added to the test
  datasource, plus a `@Timeout(10s)` to prevent an undiagnosed hang from
  leaving `@AfterEach` cleanup unrun.
- **Minor**: an unused, speculative `VerificationProofRequest` DTO was
  removed from the plan before implementation — nothing in this phase has
  a controller to consume one yet; only `VerificationProofResponse`
  (genuinely used as `issueProof`'s return type) was kept.
- **Minor**: test-count arithmetic in the plan corrected (28 → 32,
  accounting for the tests added above).

## A sixth issue, found empirically during implementation (not planning)

Task 3's `PhoneVerificationProofRepository` consumption methods passed
their own tests under `@DataJpaTest` (which auto-wraps every test method in
a transaction), but Task 4's `@SpringBootTest` concurrency test (which does
**not** auto-wrap) threw `jakarta.persistence.TransactionRequiredException`
when worker threads called `consumeIfValid` directly with no ambient
transaction. The implementer correctly reported this as **BLOCKED** rather
than forcing a pass or unilaterally editing already-committed Task 3 code.
Root cause: a custom `@Modifying @Query` repository method has no
transaction of its own unless one is supplied — Spring Data's
default-transaction wrapping reliably covers only `SimpleJpaRepository`'s
own CRUD methods, not custom `@Query` methods. Fix (applied by the
controller, as its own dedicated commit distinct from Task 3's original
one): added `@Transactional` directly to both `consumeIfValid` and
`consumeIfValidForPurpose`. Re-verified no regression on Task 3's own 8
tests, then re-verified the concurrency test now passes reliably (2
consecutive runs, ~9-11s elapsed, well under the 10s timeout). A reviewer
(opus) independently confirmed this is the correct, standard remedy and
that `REQUIRED` propagation will let a future `@Transactional` service
method join rather than conflict — with one forward-looking note carried
into the ledger: `clearAutomatically = true` clears the *entire* shared
persistence context, so any future service method must call the consume
method before loading/mutating other entities in the same transaction.

## Completed tasks

All 9 application-code tasks complete, committed, and independently
reviewed — no Critical findings on any task; every Important finding was
either fixed immediately in-session or is explicitly recorded as a binding
constraint for a later phase:

1. `phone_verification_proofs` additive SQL Server migration (both
   `autowash_pro` and `autowash_pro_test`, live-verified via `sqlcmd`).
2. `TooManyRequestsException` + 429 mapping in `GlobalExceptionHandler`
   (plus, as a separate, accurately-labeled commit, completing an earlier
   session's documented-but-never-committed FR-003 `ForbiddenException`
   fix that was sitting uncommitted in the same file — see "Incident"
   below).
3. `VerificationPurpose` enum + `PhoneVerificationProof` entity +
   `PhoneVerificationProofRepository` (8 tests, `clearAutomatically = true`
   fix applied).
4. `PhoneVerificationProofConcurrencyTest` — the load-bearing proof that
   exactly one of 10 concurrent consumption attempts on the same proof
   succeeds. Surfaced and fixed the `@Transactional` gap described above.
5. `RateLimiter` — deterministic, `Clock`-injected, in-memory fixed-window
   limiter (4 tests).
6. `GuestVerificationService.issueProof` — server-side Firebase-verified
   proof issuance, with the security-critical reordering fix (5 tests,
   independently re-verified line-by-line by the task reviewer).
7. `GuestVerificationService.consumeProofForPhone` /
   `.consumeProofForLookup` (6 tests + 1 gap-closing test added after
   review — see below).
8. `BookingRepository.findByBookingRef` (2 tests).
9. `GuestBookingLookupAuthorizationService` + the real-database
   `GuestBookingLookupAuthorizationIntegrationTest` proving the
   non-transactional invariant behaviorally (4 + 1 tests, independently
   re-verified by the task reviewer).

Post-review fix (Task 7): the reviewer found `consumeProofForPhone`'s
blank-token short-circuit had no test coverage, unlike its
`consumeProofForLookup` sibling — closed same-session by adding
`consumeProofForPhone_blankToken_throwsGenericBadRequestWithoutQueryingRepository`
(commit `1b222f2`), verified 12/12 passing.

## Files created/modified across Phase 2

- `Back-end/database/FR004v2_phase2_guest_verification_migration.sql` (new)
- `Back-end/src/main/java/com/autowashpro/exception/custom/TooManyRequestsException.java` (new)
- `Back-end/src/main/java/com/autowashpro/exception/custom/ForbiddenException.java` (new, but pre-existing FR-003 work, see incident below)
- `Back-end/src/main/java/com/autowashpro/exception/handler/GlobalExceptionHandler.java` (modified twice — FR-003 completion, then Task 2)
- `Back-end/src/test/java/com/autowashpro/exception/handler/GlobalExceptionHandlerTest.java` (new, modified twice for the same reason)
- `Back-end/src/main/java/com/autowashpro/entity/VerificationPurpose.java` (new)
- `Back-end/src/main/java/com/autowashpro/entity/PhoneVerificationProof.java` (new)
- `Back-end/src/main/java/com/autowashpro/repository/PhoneVerificationProofRepository.java` (new, then modified for the `@Transactional` fix)
- `Back-end/src/test/java/com/autowashpro/repository/PhoneVerificationProofRepositoryTest.java` (new)
- `Back-end/src/main/resources/application-test.properties` (modified — Hikari pool size)
- `Back-end/src/test/java/com/autowashpro/service/PhoneVerificationProofConcurrencyTest.java` (new)
- `Back-end/src/main/java/com/autowashpro/service/RateLimiter.java` (new)
- `Back-end/src/test/java/com/autowashpro/service/RateLimiterTest.java` (new)
- `Back-end/src/main/java/com/autowashpro/dto/response/VerificationProofResponse.java` (new)
- `Back-end/src/main/java/com/autowashpro/utils/ProofTokenGenerator.java` (new)
- `Back-end/src/main/java/com/autowashpro/service/GuestVerificationService.java` (new, extended in Task 7)
- `Back-end/src/main/java/com/autowashpro/service/impl/GuestVerificationServiceImpl.java` (new, extended in Task 7)
- `Back-end/src/test/java/com/autowashpro/service/impl/GuestVerificationServiceImplTest.java` (new, extended in Task 7, extended again post-review)
- `Back-end/src/main/java/com/autowashpro/repository/BookingRepository.java` (modified — 1 method)
- `Back-end/src/test/java/com/autowashpro/repository/BookingRepositoryTest.java` (new)
- `Back-end/src/main/java/com/autowashpro/service/GuestBookingLookupAuthorizationService.java` (new)
- `Back-end/src/main/java/com/autowashpro/service/impl/GuestBookingLookupAuthorizationServiceImpl.java` (new)
- `Back-end/src/test/java/com/autowashpro/service/impl/GuestBookingLookupAuthorizationServiceImplTest.java` (new)
- `Back-end/src/test/java/com/autowashpro/service/GuestBookingLookupAuthorizationIntegrationTest.java` (new)

## Incident: pre-existing uncommitted FR-003 fix discovered mid-task

Committing Task 2's `GlobalExceptionHandler.java` change surfaced a
`ForbiddenException`/`handleForbidden` addition already present in the
working tree — real, already-tested code from an earlier session's
documented FR-003 vehicle-ownership authorization fix (see PROGRESS.md's
2026-07-21 entry) that had simply never been committed to git (`git log`
showed zero history for `ForbiddenException.java`, and the committed `HEAD`
version of `GlobalExceptionHandler.java` had no `ForbiddenException`
handler at all). Rather than silently including it in Task 2's commit, the
controller reconstructed the FR-003-only intermediate state, verified it
in isolation (1/1 test passing), committed it separately and accurately
(`c98485a`), then restored and committed Task 2's own clean addition on top
(`3bcf0c9`, re-verified 2/2). This does not complete the full FR-003 fix —
`VehicleServiceImpl.java`'s throw-site change and its test remain
uncommitted, untouched, pre-existing pile content.

## Evidence

- **Registration-flow regression check**: `mvn -f Back-end/pom.xml test
  -Dtest=AuthServiceImplTest` — `BUILD SUCCESS`, 7/7, unchanged from before
  Phase 2 (no task in this plan modified `AuthServiceImpl.java`,
  `FirebaseTokenVerifier(Impl).java`, `VerifiedFirebaseIdentity.java`, or
  `PhoneNormalizer.java` — only reused them).
- **Full suite**: `mvn -f Back-end/pom.xml test` — `BUILD SUCCESS`, **59/59**
  passing, 0 failures, 0 errors, 0 skipped (26 pre-existing from Phase 1 +
  33 new: `GlobalExceptionHandlerTest` +1, `PhoneVerificationProofRepositoryTest`
  8, `PhoneVerificationProofConcurrencyTest` 1, `RateLimiterTest` 4,
  `GuestVerificationServiceImplTest` 12, `BookingRepositoryTest` 2,
  `GuestBookingLookupAuthorizationServiceImplTest` 4,
  `GuestBookingLookupAuthorizationIntegrationTest` 1).
- **Live SQL Server evidence**: both `autowash_pro` and `autowash_pro_test`
  confirmed via `sys.tables` to have the new `phone_verification_proofs`
  table. Row count is 0 on both — expected, since no controller exists yet
  to issue a real proof against the dev DB, and the test DB's rows are
  cleaned up by `@DataJpaTest` auto-rollback / the concurrency and
  integration tests' manual `@AfterEach` cleanup.

## Scope boundary held throughout Phase 2

No HTTP controller or endpoint was added (neither a proof-issuance
endpoint nor `GET /api/v1/bookings/{ref}` itself). No VNPAY, no slot/bay
allocation, no Swagger annotation completion, no frontend change, no
`audit_logs` writes (deferred to whichever phase implements the write
paths that would produce meaningful audit rows), no Guest/Customer merge
logic (BR-032) — this phase never creates or reads `Guest`/`Customer` rows
at all, it only proves phone ownership.

## Known forward-looking constraints for later phases (not Phase 2 defects)

Carried forward from Phase 1's final review, still unresolved (Phase 2 did
not touch guest-booking creation):
- `Booking.vehicle_id` is still `nullable = false` — a real guest booking
  with no owned vehicle cannot yet persist. Whichever phase implements
  guest-booking creation must resolve this.
- `BookingManagementService.complete()`/`toResponse()` and
  `AdminService.bookingMap()` will NPE on a guest-only booking once one is
  ever created.

New from Phase 2:
- `IdempotencyRecord`'s principal-scoping gap (from Phase 1's review)
  remains open — Phase 2 did not implement idempotency-key usage.
- `clearAutomatically = true` on `PhoneVerificationProofRepository`'s
  consumption methods clears the *entire* shared persistence context, not
  just the proof row. Whichever phase's service method calls
  `consumeIfValid`/`consumeIfValidForPurpose` inside a larger transaction
  that has already loaded other managed entities must call the consume
  method first, before loading/mutating anything else, or risk
  detached-entity surprises.
- The test suite's non-hermeticity (needs a live SQL Server
  `autowash_pro_test` + `DB_PASSWORD`), flagged in Phase 1's final review,
  remains undocumented in any committed README/AGENTS.md file — now true
  for an even larger fraction of the suite (`@SpringBootTest` tests in
  addition to `@DataJpaTest` ones).

## Final whole-branch review

After all 9 application-code tasks and Task 10 were done, a final
whole-branch review was dispatched on the most capable available model
(opus), covering the complete Phase 2 diff as one unit (13 commits,
`475619d..5386f26` — the range starting right after Phase 1's own final
review commit). Its job was different from the per-task reviews: verify
the two security-fix outcomes (Task 6's `issueProof` reordering, Task 9's
non-transactional `authorize()`) hold not just individually but as a
*composed system* end-to-end, check the `@Transactional` layering across
repository + service + the deliberately-non-transactional primitive is
consistent, and confirm every one of the plan's "Frozen decision" sections
is actually honored in the diff, not just designed correctly on paper.

**Verdict: Ready to merge.** No Critical findings. The reviewer traced the
full call chain `issueProof` → `consumeProofForLookup`/`consumeProofForPhone`
→ `authorize()` and confirmed it delivers every Global Constraint promise
(never trusts a client-claimed phone — the lookup path derives phone from
the stored proof row, never caller input; opaque/single-use/replay-resistant
— proven concurrently and durably-across-exceptions; no enumeration — all
six consumption failures collapse to one message, and the 404-vs-403
booking distinction is only reachable after a proof burn). Confirmed the
`@Transactional` layering (repository-level + service-level `REQUIRED`,
both nesting harmlessly; `authorize()` correctly non-transactional) is
consistent, not conflicting. Confirmed the 3-key rate-limiter set
(`"issue|"+verifiedPhone+"|"+purpose`, `"consume|"+proofToken`,
`"lookup|"+proofToken`) has no bypass or cross-flow budget theft. Confirmed
test-isolation between `@DataJpaTest` (auto-rollback) and the two
`@SpringBootTest` tests (manual UUID-scoped cleanup) cannot pollute shared
state across a full `mvn test` run. Confirmed the 59/59 (26+33) evidence is
internally consistent with the diff.

**1 Important finding** — explicitly *not* a Phase 2 defect; binding design
input for whichever later phase adds a real consumption endpoint:

1. **`RateLimiter` never evicts entries, and the consumption-side limiters
   are keyed on attacker-suppliable proof tokens.**
   `consumeProofForPhone`/`consumeProofForLookup` key on
   `"consume|"+proofToken` / `"lookup|"+proofToken` — any non-blank token
   reaches `rateLimiter.tryConsume` *before* the DB check. Not reachable
   today (no controller exists to accept external tokens), but once a real
   HTTP endpoint is wired, a flood of distinct garbage tokens would grow
   the in-memory map without bound — an unbounded-memory DoS. **The
   controller phase must add stale-window eviction or a bounded cache
   before exposing proof consumption externally.**

**5 Minor findings**, all recorded, none blocking: (1) `consumeProofForLookup`'s
replay-safety is correct today but entirely contingent on the "never wrap
`authorize()` in an outer `@Transactional`" invariant holding forever —
recommend `Propagation.REQUIRES_NEW` on `consumeProofForLookup`/
`consumeProofForPhone` as belt-and-suspenders once a controller exists, so
the burn stays durable regardless of future caller transaction context;
(2) a test-count bookkeeping nuance (34 `@Test` methods added in-diff vs
"33 new" in the evidence above) fully explained by the FR-003 incident's
`handleForbidden` test landing inside the review range — not an integrity
problem; (3) `PhoneNormalizer`'s distinct format-error messages on the
caller's own phone input (restated from Task 7's own Minor finding); (4)
`application-test.properties` remains under `src/main/resources` rather
than `src/test/resources` (a Phase 1 finding, now extended with the Hikari
pool-size line); (5) `mvn test` now boots the full Spring context via
`@SpringBootTest`, running Phase 1's `BaySeeder`/`SystemAccountSeeder`
against `autowash_pro_test` (idempotent and harmless, but widens the
suite's live-DB coupling further, extending Phase 1's already-flagged
non-hermeticity).

## Evidence status

This log records Phase 2 as fully implemented, committed, reviewed, and
having passed its final whole-branch review, with live SQL Server evidence
and a clean full-suite run. **Do not claim the Backend + Swagger gate has
passed** — Phase 2 added no HTTP endpoint at all. Guest booking creation
(which must resolve the `vehicle_id` gap above), the real proof-issuance
and booking-lookup controllers (which must also resolve the RateLimiter
unbounded-growth finding above), VNPAY, slot/bay allocation, RBAC, and
Swagger completion all remain outstanding, each requiring its own plan
before implementation starts.
