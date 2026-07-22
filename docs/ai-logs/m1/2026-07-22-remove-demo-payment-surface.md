# Remove demo payment surface

## Task

Remove the customer self-confirmation and VietQR demonstration payment surface
while preserving code that is reusable for the approved Phase 3C booking and
PayOS payment plans.

## Accepted changes

- Removed the `PATCH /api/v1/payments/{id}/confirm` controller and its
  service/test implementation. A customer can no longer mark a payment paid.
- Removed generated VietQR data, its response field, payment UI/card, and
  related i18n text.
- Removed routed in-memory customer booking, loyalty, voucher, and lifecycle
  screens, because they could change visible state without a real backend
  contract. The customer shell now exposes only the real profile, garage, and
  booking paths.
- Retained the payment entity/repository, locking primitive, lifecycle support,
  customer profile, vehicle, and staff queue functionality. PayOS configuration
  and client DTO/interface scaffolding were retained.
- Removed two AI logs whose only purpose was documenting an earlier demo pass;
  plans, SRS, design documents, and non-demo evidence were retained.

## Evidence

- Independent frontend, backend, documentation, security, and test-first
  reviews classified the self-confirm endpoint and VietQR provider as demo-only.
- The latest pre-change backend gate with the local `.env` loaded ran 246 tests:
  237 passed, 1 failed, and 8 errored. The errors are the existing
  `AvailabilityRepositoryIntegrationTest` missing-bean issue, with the known
  booking concurrency failure also remaining.

## Rejected changes

- Did not delete plans, SRS, design documents, payment persistence, or the
  PayOS scaffolding.
- Did not represent the retained booking/payment persistence as a real payment
  integration.

## Verification

- `mvn -f Back-end/pom.xml -Dtest=BookingManagementServiceTest test` — passed:
  2 tests, 0 failures, 0 errors.
- `npm --prefix Front-end run typecheck` — passed.
- `npm --prefix Front-end run build` — passed; Vite reported an existing
  chunk-size warning only.

The full backend suite was not rerun after this scoped deletion. Its latest
`.env`-loaded result before this change was 237/246 passing; the 1 failure and
8 errors must be addressed separately.
