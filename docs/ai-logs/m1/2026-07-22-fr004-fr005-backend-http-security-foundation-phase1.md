# AI log — FR-004/FR-005 backend HTTP and security foundation

- Date: 2026-07-22
- Branch: `chore/harness-setup`
- Commits: `861dd9d`, `8aa636e`, `b8e49fc`
- Scope: expose the previously service-only guest verification foundation over
  stable HTTP, close the Phase 2 proof-consumption review findings, harden API
  security/error handling, and establish partial OpenAPI contracts. This phase
  intentionally does not claim the Backend + Swagger gate.

## Requirements and source decisions

- Followed the current mission, approved FR-001..FR-013 SRS, business rules,
  and approved design decisions. The original lecturer rubric was not found;
  the uncited TODO checklist was not treated as authoritative evidence.
- Supported both approved six-character and already-issued eight-character
  `AWP-` references for backward compatibility.
- Preserved the approved lookup contract: a guest proof is consumed before
  reference/ownership resolution, and unknown versus unowned references remain
  `404` versus `403` respectively.
- Used direct `HttpServletRequest.getRemoteAddr()` so untrusted forwarded
  headers cannot spoof throttling identity. A future reverse-proxy deployment
  must configure and test trusted proxy address resolution explicitly.

## Delivered

- Public, purpose-fixed booking and booking-lookup proof issuance endpoints
  that verify Firebase identity server-side and return raw proofs once with
  `no-store` responses.
- SHA-256 proof digests at rest, strict proof syntax validation, atomic SQL
  consumption, and proxied `REQUIRES_NEW` transactions that keep burns durable
  after later `403`/`404` rollbacks.
- JWT-or-single-use-proof `GET /api/v1/bookings/{bookingRef}` with customer and
  guest IDOR protection and an owner-safe response excluding phone, customer
  IDs, and proof material.
- Bounded, expiring, separately scoped rate-limiter storage. Guest lookup uses
  origin-first and global circuit-breaker quotas; customer lookup uses the
  verified JWT subject. A blocked origin cannot drain the global quota.
- Bounded scheduled proof cleanup using SQL Server `DELETE TOP` batches.
- Stable API error DTOs across controllers and Spring Security, strict invalid
  Bearer rejection, exact public method/path matchers, explicit-origin CORS,
  and accurate `Retry-After` values.
- Privileged account bootstrap is disabled by default, reads complete values
  only from environment configuration, preflights both accounts before any
  insert, and is transactionally atomic.
- Partial OpenAPI bearer/proof security schemes and success/error documentation
  for the new endpoints. Sensitive OTP/password/token examples were removed.
- A safe `Back-end/run-tests.ps1` runner that loads the ignored `.env` without
  printing secret values. Test-only datasource properties now live under
  `src/test/resources` rather than the production artifact.

## TDD and verification evidence

- RED: `RateLimiterTest` initially failed test compilation because the new
  global scope did not exist.
- GREEN repair gate: 31/31 focused rate-limit, seeder, security/CORS, and HTTP
  lookup tests passed.
- First complete clean suite: 95/95 passed.
- Adversarial review then found two High throttling issues. RED regression run
  proved them: the global limiter was called 70 instead of 60 times after one
  origin was blocked, and an authenticated customer's 61st reference probe
  returned `404` instead of `429`.
- Post-fix focused command:
  `& Back-end/run-tests.ps1 -Tests "BookingControllerRateLimitTest,GuestBookingLookupHttpIntegrationTest,GlobalExceptionHandlerTest"`
  — BUILD SUCCESS, **18/18**, 0 failures/errors/skips.
- Final clean command: `& Back-end/run-tests.ps1 -Clean` — BUILD SUCCESS,
  **98/98**, 0 failures/errors/skips. Spring Data and HTTP integration tests
  connected to the configured `autowash_pro_test` SQL Server database.
- Final corrected adversarial security review: no Critical, High, or new
  code-level Medium finding in the latest fixes.

## Review findings and disposition

Accepted and fixed: unbounded attacker-controlled limiter growth; non-durable
proof consumption under outer rollback; missing real HTTP IDOR coverage; broad
public matchers; eight-only booking references; partial privileged-account
bootstrap; Firebase work inside a database transaction; invalid Bearer
downgrade; global-quota victim lockout; unlimited customer probes; misleading
`Retry-After`; and stale transaction commentary.

Accepted residuals: process-local throttling resets on restart; a horizontally
scaled deployment needs shared throttling; `getRemoteAddr()` may represent a
proxy/NAT; the approved `404`/`403` split is a limited existence oracle; and GET
lookup burns a proof. SQL Server remains authoritative for proof single-use.

Rejected/deferred: HMAC-obscuring phone-derived limiter keys was not added.
Raw phones are not retained, but SHA-256 is not claimed to anonymize the small
phone-number space. A keyed distributed limiter belongs with an explicit
multi-instance deployment design.

## External and human validation

- Firebase verification is mocked at the external boundary; no real Phone OTP,
  SMS delivery, Google account, or service-account rotation was verified.
- VNPAY credentials, signatures, return/IPN callbacks, expiry, replay,
  reconciliation, and live settlement were outside this phase and remain open.
- No frontend/browser E2E applies to this backend-only phase.
- Human validation has not yet been reported. Automated evidence is recorded
  above without substituting for owner acceptance.

## Traceability impact

- FR-004: PARTIAL — guest proof issuance and secure booking lookup are real;
  guest/member creation, 15-minute availability, and atomic holds remain open.
- FR-005: PARTIAL — stable errors and `410 Gone` infrastructure exist; VNPAY
  payment/lifecycle behavior remains open.

## Related files

- `Back-end/src/main/java/com/autowashpro/config/**`
- `Back-end/src/main/java/com/autowashpro/controller/BookingController.java`
- `Back-end/src/main/java/com/autowashpro/controller/GuestVerificationProofController.java`
- `Back-end/src/main/java/com/autowashpro/service/RateLimiter.java`
- `Back-end/src/main/java/com/autowashpro/service/impl/GuestVerificationServiceImpl.java`
- `Back-end/src/main/java/com/autowashpro/service/impl/BookingLookupServiceImpl.java`
- `Back-end/src/test/**`
- `Back-end/run-tests.ps1`

