# FR-004/FR-005 booking availability — Phase 3B

Date: 2026-07-22
Implementation commit: `7543192` (`feat: add trusted 15-minute branch availability`)

## Scope completed

- Added the canonical public `GET /api/v1/branches` collection using a minimized
  booking-facing DTO and `GET /api/v1/branches/{branchId}/slots` for trusted,
  15-minute bay capacity.
- Kept `GET /api/v1/bookings/availability` as a documented deprecated adapter
  for the existing frontend. New code resolves active service IDs, prices,
  quantities, duration, booking mode, and bay compatibility from server-owned
  catalog data. Client duration is accepted only by the compatibility path and
  is bounded to the 660-minute operating day.
- Implemented the 07:00-18:00, 44-cell grid; one-compatible-bay consecutive
  allocation; QUICK/DETAIL/UNIVERSAL compatibility; active-bay filtering;
  exact minimum-advance and guest/tier booking windows; UTC API timestamps;
  flexible-service handling; capacity reasons; and up to three forward
  alternatives across allowed dates.
- Added a half-open SQL reservation query, expired-HOLD exclusion and scheduled
  cleanup, conservative fallback for explicitly marked legacy bookings in the
  exact BR-012 active states, atomic default-bay insertion, and database
  constraints for the slot grid, HOLD/BOOKED expiry shape, and booking/branch
  consistency.
- Added bounded public/global/authenticated polling quotas. Keys use the
  already-hardened bounded and expiring `RateLimiter`; invalid explicit bearer
  tokens fail with `401` instead of silently receiving guest behavior.
- Completed OpenAPI success/error/status documentation, optional anonymous-or-
  bearer security, deprecated-route marking, and HTTP/JWT regressions for
  customer subject derivation, staff/admin guest policy, malformed tokens, and
  both availability routes' throttling.

## Requirements and assumptions

- BR-027 is authoritative for UTC API timestamps; Vietnam local time is used
  only for branch operating-hour calculations.
- BR-012's exact active capacity set (`CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`,
  `AWAITING_CONFIRM`) overrides a review suggestion to treat unpaid
  `PENDING_DEPOSIT` as a legacy branch-wide block. Only rows explicitly marked
  `legacy_financial_snapshot = 1` can activate the conservative fallback.
- Service IDs are the canonical contract. The old service-code endpoint remains
  temporarily for backward compatibility and is explicitly deprecated.
- Mixed or UNIVERSAL-required selections use UNIVERSAL bays. Flexible-only
  selections return policy metadata without fabricating a hard slot grid, as
  required by the approved UI/design source.
- Direct socket addresses are intentionally used for local rate limits; spoofable
  forwarding headers are not trusted. A reverse-proxy deployment must provide a
  trusted address-resolution/ingress quota policy before relying on per-client
  quotas.

## Database evidence

`FR004v2_phase3b_availability_migration.sql` was applied to both
`autowash_pro_test` and `autowash_pro`, then applied again to both databases.
All four executions succeeded. The pre-migration audit found zero reservation
rows, zero off-grid rows, and zero invalid expiry rows in both databases; repeat
bay seeding affected zero rows as expected.

## Test evidence

- Focused availability, schema, repository, OpenAPI, limiter, and cleanup gate:
  `& Back-end/run-tests.ps1 -Tests 'BaySeederTest,BayRepositoryTest,BookingAvailabilityServiceTest,TrustedBookingCatalogServiceTest,ExpiredSlotHoldCleanupJobTest,AvailabilityRepositoryIntegrationTest,BookingEngineSchemaIntegrationTest,BranchSlotHttpIntegrationTest,OpenApiAvailabilityContractTest,BookingControllerRateLimitTest'`
  — **41/41 passed**, 0 failures, 0 errors, 0 skipped.
- Post-review optional-auth HTTP regressions:
  `& Back-end/run-tests.ps1 -Tests 'BranchSlotHttpIntegrationTest'`
  — **8/8 passed**, 0 failures, 0 errors, 0 skipped.
- Final clean backend gate for this phase:
  `& Back-end/run-tests.ps1 -Clean`
  — **184/184 passed**, 0 failures, 0 errors, 0 skipped; Maven compiled 135
  main source files and 39 test source files against SQL Server.
- A direct `mvn -f Back-end/pom.xml test` attempt failed before tests because
  its process did not have the gitignored `DB_PASSWORD`. It is recorded as an
  environment-precondition failure and is not behavioral evidence. The secure
  repository launcher loaded process-only local configuration without printing
  or committing secrets and invoked Maven successfully.

## Review outcome

The independent post-fix code review found no unresolved Critical, High, or
Medium findings. The adversarial security review found no Critical or High
findings and raised three Medium items:

- Accepted and fixed: added real HTTP/JWT tests for optional authentication and
  the deprecated adapter's rate limit.
- Accepted for Phase 3C: expiry must conditionally transition and audit the
  owning `PENDING_DEPOSIT` booking in the same transaction that releases holds,
  with cleanup-versus-payment concurrency coverage. Booking creation is not yet
  exposed through the v2 contract, so this is binding work for that phase.
- Deployment caveat: retain safe direct-address behavior locally; document and
  test trusted-proxy/ingress configuration in the deployment environment rather
  than trusting arbitrary forwarding headers in application code.

No frontend work started because the Backend + Swagger gate is still open.
Next: transactional member/guest booking creation, proof consumption,
idempotency, atomic holds, lifecycle-coupled expiry, and concurrency tests.
