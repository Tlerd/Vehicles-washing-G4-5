# Plan: FR-004 Real (Non-Mock) Booking Wizard

- Date: 2026-07-21
- Status: **Audit complete, awaiting owner decisions below. No implementation
  in this pass** — the contract is not yet clear/settled enough to satisfy the
  "only implement when the contract is clear and secure" precondition this
  plan was commissioned under.
- Related: docs/srs/FR-004-booking-wizard-navigation.md,
  docs/srs/FR-005-booking-checkout-vietqr-payment.md,
  docs/ai-logs/m1/2026-07-21-role-routing-guest-booking-audit.md,
  docs/ai-logs/m1/2026-07-21-fr004-audit-and-fr003-review.md (this session's
  audit evidence)

## Why no code changed in this pass

A 4-agent parallel audit (backend, frontend, testing, security — see the AI
log) found the booking wizard is 100% mock across all six steps, and surfaced
several decisions that materially change what "the safe, well-defined
portion" even means. Implementing against an unsettled contract would produce
exactly the kind of half-finished, silently-scope-narrowed work this project's
guidelines forbid. The decisions below need an explicit owner call before any
wizard step is wired to a real API.

## Current state (verified by the audit)

- **Frontend**: every one of the 6 steps (`Front-end/src/features/booking/`)
  reads from `Front-end/src/lib/mock/api.ts` / `lib/mock/catalog.ts`. Step 6's
  "Xác nhận đặt lịch" button only sets a local `confirmed` boolean — no HTTP
  request is ever made, no booking is ever created.
- **Backend already has a working, authenticated booking API** — but it
  implements an earlier, simpler design than the FR-004/FR-005 v2 spec:
  - Real endpoints today: `GET /api/v1/catalog/branches`,
    `GET /api/v1/catalog/services`, `GET /api/v1/bookings/availability`,
    `POST /api/v1/bookings`, `GET /api/v1/bookings/customer/{id}`.
  - FR-004's own spec text names different paths (`GET /api/v1/branches`,
    `GET /api/v1/branches/{id}/slots?date=&duration=`) that don't exist, and
    cites a `docs/refactor/` directory that doesn't exist in this repo
    (real path is `docs/srs/06-BUSINESS-RULES-V2.md`) — the spec document
    itself needs a reconciliation pass analogous to what FR-001/FR-002 just
    got, separate from this plan.
  - Booking creation writes status `PENDING` directly (not `PENDING_DEPOSIT`),
    with a 30-minute/branch-level overlap check (not the spec's 15-minute
    grid with bay capacity and soft-holds), and returns a static VietQR image
    URL with no VNPAY integration anywhere in the codebase (zero matches for
    `vnpay`/`VNPAY` repo-wide).
  - Booking creation **always** requires an authenticated
    CUSTOMER/STAFF/ADMIN JWT and always resolves a persistent `Customer` +
    `Vehicle` — confirmed independently by both the backend and security
    audits. This reconfirms the 2026-07-21 guest-booking SQL-migration
    rejection still holds; nothing has changed since that audit.
- **Schema gap**: `Back-end/database/AutoWashPro.sql` has no `bays`,
  `slot_reservations`, `guests`, `payments`, or `audit_logs` tables, and no
  `buffer_min`/`is_size_dependent`/`pricing_unit`/`booking_mode` columns on
  `services`. `bookings.customer_id` is a `NOT NULL` FK — guest bookings
  cannot be persisted without a schema change.
- **A live, unreconciled `VehicleSize` mismatch**: the backend enum is
  `HATCHBACK/SEDAN/SUV/PICKUP` (multipliers `0.9/1.0/1.2/1.4`, applied once to
  the booking total), already used by the real Garage feature
  (`Front-end/src/lib/api/vehicles.ts`). The booking wizard's own
  `Front-end/src/lib/money.ts` instead uses `S/M/L` (`1.0/1.2/1.4`) matching
  the v2 BR-001 doc. These are two different, currently-untested-against-
  each-other pricing models.
- **Test tooling reality check**: the repo has exactly 3 backend test files
  (plain JUnit 5 + Mockito, no Spring context, no Testcontainers, no
  `spring-security-test`) and zero frontend test infrastructure (no
  vitest/jest/Playwright, no `test`/`lint` script in `package.json`). Proving
  the two hardest FR-005 acceptance criteria (IPN-only-confirms;
  concurrent-conflicting-reservation → 409-for-one/no-double-book) requires
  tooling (Testcontainers, a real DB) that does not exist today.
- **Two new bugs of the same class as the just-fixed FR-003 issue**, found
  independently by the security audit, in `BookingManagementService.java` —
  **not fixed in this pass, listed here for a fast, separately-scoped
  follow-up**:
  - `resolveVehicle()` (~line 63-64): an ownership check throws
    `BadRequestException` (400) instead of `ForbiddenException` (403).
  - `create()`'s voucher-ownership check (~line 49-50): same defect.
  - Neither crashes to 500 (the request is still correctly denied), so these
    are HTTP-semantics/consistency bugs, not new vulnerabilities — but they're
    the identical "wrong exception type for an authorization failure" pattern
    just fixed in `VehicleServiceImpl`, in a file this plan's audit had to
    read anyway.

## Decisions needed from the owner before implementation

1. **Target contract for Phase 1**: build against the backend's *current*
   simpler contract (`PENDING` status, VietQR link, no holds) to quickly kill
   the 100%-mock state, or hold Phase 1 until the FR-005 v2 schema/VNPAY work
   lands? **Recommendation: current contract first** (see Phase 1 below) —
   it needs zero schema migration and is independently valuable, and nothing
   in Phase 1 blocks Phase 2 from replacing it later.
2. **Guest booking**: keep `/guest/booking` as a preview/redirect-to-login
   stub until a real guest backend exists (three independent stacked
   blockers: auth-required route matcher, server-side `customerId` override,
   `NOT NULL` FK), or treat guest backend support as a Phase-1 prerequisite?
   **Recommendation: stub for now** — this is exactly what the 2026-07-21
   guest-booking SQL-migration rejection already concluded, and nothing found
   in this audit changes that conclusion.
3. **`VehicleSize` taxonomy**: standardize the frontend's `S/M/L` wizard model
   on the backend's already-persisted `HATCHBACK/SEDAN/SUV/PICKUP` enum
   (recommended — it's already real, already used by the working Garage
   feature, and rewriting the backend enum would touch persisted data), or
   migrate the backend to a 3-tier scheme?
4. **Combo services in Step 2**: the wizard's "combo" concept has zero
   backend representation (no `Combo`/`ServiceCategory` entity). Drop combos
   from Phase 1 (ship single services only) until backend schema exists, or
   block Step 2 entirely until combos are built?
5. **Test tooling additions**: approve (or defer) adding `spring-security-test`
   /Testcontainers on the backend and Vitest/Playwright on the frontend —
   none exist today and none should be added silently.

## Phase 1 — wire the wizard to the *existing* real backend (smallest step that kills 100%-mock)

Scoped to authenticated customers only; `/guest/booking` stays a stub per
decision #2 pending owner sign-off.

1. Add `Front-end/src/lib/api/bookings.ts` following the exact conventions
   already established by `lib/api/vehicles.ts`/`lib/api/auth.ts`
   (`apiClient`, `ApiError`, typed request/response interfaces, a `mapX()`
   normalizer, TanStack Query hooks with `queryClient.invalidateQueries()`).
2. Reconcile `VehicleSize` per decision #3 before touching pricing anywhere.
3. Wire Step 1 (Branch) and Step 2 (Service) to
   `GET /api/v1/catalog/branches` / `GET /api/v1/catalog/services`; ship
   single services only in Phase 1 per decision #4.
4. Wire Step 3 (Date & Time) to `GET /api/v1/bookings/availability`, honestly
   presenting today's 30-minute/branch-level granularity rather than
   simulating a 15-minute grid the backend doesn't compute.
5. Wire Step 4 (Vehicle) to add a real saved-vehicle picker for authenticated
   customers via the already-real `lib/api/vehicles.ts`, alongside the
   existing manual-entry form.
6. Wire Step 5 (Review) pricing to the real per-booking size multiplier (not
   per-line-item); either wire voucher eligibility to the real `voucherId`
   field `CreateBookingRequest` already supports, or hide that UI until it is.
7. Wire Step 6 (Confirm) to `POST /api/v1/bookings` and show the real
   booking reference + VietQR link, described accurately as manual/counter
   payment — not "VNPAY," which doesn't exist yet.
8. Validation: `npm --prefix Front-end run typecheck` and
   `npm --prefix Front-end run build` after each step; manual Chrome
   verification of each step's real network calls (no automated frontend
   test tooling exists — do not invent one per decision #5). No backend
   changes in Phase 1, so `mvn -f Back-end/pom.xml test` is unaffected.

## Phase 2 — FR-005 v2 schema, VNPAY, real slot/bay model (large, owner sign-off required before starting)

1. Schema migration: `bays`, `slot_reservations` (`UNIQUE(bay_id, slot_time)`
   per BR-030), `services` columns (`buffer_min`, `is_size_dependent`,
   `pricing_unit`, `booking_mode`), widen `bookings.status` to the full
   lifecycle (`PENDING_DEPOSIT`, `IN_PROGRESS`, `AWAITING_CONFIRM`,
   `DISPUTED`, `CHANGE_REQUESTED`, `EXPIRED`, `NO_SHOW`, …) plus `bay_id`/
   deposit columns, `payments` table, `audit_logs` table. The guest-
   persistence approach (nullable FK vs. a separate `guests` table) is a
   design decision requiring explicit sign-off — it changes every join in
   `BookingManagementService`.
2. Entity/repository additions for the above (`Bay`, `SlotReservation`,
   `Payment`, `AuditLog`; new repository finders — `BookingRepository` has no
   `findByBookingRef` today).
3. Rewrite slot/capacity/allocation logic (15-minute grid, bay-compatibility
   allocation, transactional soft-holds) — replacing, not extending,
   `validateSchedule()`.
4. Rewrite booking creation/lifecycle to the full FR-004/FR-005 state machine
   and RBAC matrix (in particular: STAFF must never reach `COMPLETED`
   directly, a named fraud control in the spec).
5. VNPAY integration: create-payment, IPN verification (must be the *only*
   path that flips `PENDING_DEPOSIT` → `CONFIRMED`), return-URL handling.
6. Scheduled jobs reusing the existing `@Scheduled` pattern already proven in
   `LoyaltyMaintenanceScheduler.java` (`ExpirePendingDeposits`, `MarkNoShow`,
   `ReleaseExpiredHolds`, `AutoConfirmCompleted`, `RemindBooking`).
7. API surface alignment to the FR-004/FR-005 documented paths
   (`GET /api/v1/branches`, `/branches/{id}/slots`, per-transition endpoints
   in place of the single generic status-PATCH).
8. Mandatory validation before declaring Phase 2 backend-complete: automated
   tests for FR-005's two explicit concurrency acceptance criteria (IPN-only-
   confirms; concurrent-conflicting-reservation → 409-for-one/no-double-book)
   — this requires the Testcontainers decision (#5) to be approved first.

## Phase 3 — guest booking (only after Phase 2's schema exists, only with explicit approval)

1. A separate, narrowly-scoped public endpoint/DTO/service — do not reuse
   `BookingManagementService.create()` as-is (it non-null-dereferences
   `Customer`/`Vehicle` in `toResponse()`/`complete()` and would NPE on a null
   guest FK).
2. A short-lived, single-use, phone-scoped OTP verification token, decoupled
   from full registration/login (no such anonymous-verification primitive
   exists today — this is net-new).
3. Rate limiting/abuse prevention on both the OTP step and booking-create
   (net-new; zero rate-limiting infrastructure exists anywhere in the backend
   today).
4. Enforce "no loyalty, no vouchers, no saved vehicles for guests" — either a
   non-login `GUEST`-tagged `Customer` row created transactionally per
   booking, or a genuinely parallel guest table with its own null-safe
   response/`complete()` logic. Explicit design decision required.

## Related findings recorded but intentionally not fixed in this session

Out of scope for this task's named request ("the vehicle ownership bug" in
`VehicleServiceImpl`, FR-001/FR-002 docs) — flagged here so they aren't lost:

- `BookingManagementService.resolveVehicle()` and the voucher-ownership check
  in `create()` throw `BadRequestException` (400) for authorization failures
  that should be `ForbiddenException` (403), mirroring the just-fixed
  `VehicleServiceImpl.findOwnedVehicle()` pattern exactly. Recommended as a
  fast, tightly-scoped follow-up.
- The rest of `VehicleServiceImpl` (`createVehicle`, `updateVehicle` field
  validation, `deleteVehicle`'s "keep at least one vehicle" rule,
  license-plate/size validation) still throws bare `RuntimeException` → 500
  for what should be 400/404/409 — same defect family, wider blast radius,
  outside this task's specifically-named "vehicle ownership" scope.
- `AuthServiceImpl.register()` checks `existsByPhone` before verifying the
  Firebase token, so an unauthenticated caller with any syntactically valid
  (not necessarily verified) token shape can distinguish "phone registered"
  (409) from "phone not registered" (400 from token failure) — a minor
  enumeration oracle, unrelated to FR-003/FR-004, not part of this task.
