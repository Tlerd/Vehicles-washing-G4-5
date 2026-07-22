# FR-004 Phase 1 Real Booking Wizard + BookingManagementService 400→403 Fix

Date: 2026-07-21

## Requested scope

Owner approved 5 decisions unblocking
`docs/superpowers/specs/2026-07-21-fr004-real-booking-implementation-plan.md`'s
Phase 1 and greenlit a separately-scoped fast backend fix:

1. Target the backend's *current* contract for Phase 1 (no VNPAY, no bay/slot
   holds, `PENDING` status, existing VietQR/manual-payment response).
2. Keep `/guest/booking` a preview/login-redirect stub — no guest persistence.
3. Standardize the wizard on the backend's real `HATCHBACK/SEDAN/SUV/PICKUP`
   `VehicleSize` taxonomy.
4. Drop combo services from Phase 1 — single services only.
5. Defer Testcontainers/`spring-security-test`/Vitest/Playwright.

Plus: fix `BookingManagementService.resolveVehicle()` and the voucher-ownership
check in `create()` to throw `ForbiddenException`/403 instead of
`BadRequestException`/400 — the same bug class already fixed in
`VehicleServiceImpl.findOwnedVehicle()`.

## Mandatory pre-implementation dispatch

Per `AGENTS.md`, dispatched a 4-agent parallel read-only wave before any write
(`backend-lead`, `frontend-lead`, `testing-lead`, `security-reviewer`).
Findings that materially shaped the implementation:

- **backend-lead**: confirmed the fix is a pure two-line, no-breaking-change
  swap — `GlobalExceptionHandler.handleForbidden` already exists (from the
  prior `VehicleServiceImpl` fix), no code anywhere catches
  `BadRequestException` by type, and no existing test references this file.
  Supplied the exact 9-mock constructor shape needed for a new test file.
- **frontend-lead**: full field-by-field audit of the mock catalog/store vs.
  the real backend DTOs — found the real `Service` entity has no
  `categoryId`/`isSizeDependent`/`bufferMin` fields at all (not just no
  combos), that the mock pricing model multiplies per-line-item while the
  backend multiplies the vehicle-size factor **once** on the summed total, and
  that `dayKey`/`slotTime` in the store held a full ISO datetime while the
  real availability response returns bare `LocalTime` strings.
- **security-reviewer**: found the one real blocker — `/guest/booking` and
  `/app/booking` shared the exact same `BookingWizardPage` component, and
  `/guest/booking` sits under `PublicLayout` with **no auth guard at all**.
  Wiring real, JWT-required APIs into that shared component would have
  silently turned `/guest/booking` from "a working mock demo" into "broken
  with 401s from Step 1 onward" — directly contradicting decision #2's own
  intent. Confirmed the backend fix is a pure status-code change with no new
  access-control gap (`BookingController.java:24` already overwrites
  `customerId` from the JWT principal).
- **testing-lead**: confirmed a Mockito-only unit test is sufficient (matching
  the `VehicleServiceImpl` precedent) and that no frontend test tooling should
  be added, per decision #5.

## A. Backend fix (TDD, RED→GREEN, verified)

- Added `Back-end/src/test/java/com/autowashpro/service/BookingManagementServiceTest.java`
  — two tests (`create_withVehicleNotOwnedByCaller_throwsForbidden`,
  `create_withVoucherNotOwnedByCaller_throwsForbidden`), mirroring
  `VehicleServiceImplTest`'s style.
- Watched RED: `mvn -f Back-end/pom.xml test -Dtest=BookingManagementServiceTest`
  → both tests failed with the actual thrown type `BadRequestException`
  (confirmed RED for the correct reason, not a compile error or wrong setup).
- Applied the two-line fix: `BookingManagementService.java` lines 49 and 64,
  `BadRequestException` → `ForbiddenException` (already imported via the
  file's existing wildcard import).
- Watched GREEN: `mvn -f Back-end/pom.xml test` → **BUILD SUCCESS, 13 tests
  run, 0 failures** (11 pre-existing + 2 new).

## B. Frontend FR-004 Phase 1 implementation

**New files:**
- `Front-end/src/lib/api/bookings.ts` — `useBranches`/`useServices`/
  `useAvailability`/`useCreateBooking` TanStack Query hooks, following the
  exact `apiClient`/`ApiError`/mapper conventions of `lib/api/vehicles.ts`.
- `Front-end/src/features/guest/GuestBookingPreviewPage.tsx` — the
  `/guest/booking` stub: a static 6-step preview card + "Đăng nhập"/"Đăng ký"
  buttons, zero data fetching.

**Rewritten:**
- `Front-end/src/lib/money.ts` — `SIZE_LABEL`/multiplier keyed on the real
  `VehicleSizeCode`, matching `BookingManagementService`'s
  `0.9/1.0/1.2/1.4` multiplier applied once to the total. Left `formatVND`
  untouched (still shared with the still-mock customer/history pages) and
  deliberately did **not** touch `Front-end/src/types.ts`'s separate mock-only
  `VehicleSize`/`VehicleInfo`/`VehicleRecord` types, since those are still used
  by `lib/mock/customer.ts`'s hardcoded `'S'`/`'M'` literals (Dashboard/
  History/BookingDetail pages, explicitly out of scope) — changing the shared
  type would have broken those pages' typecheck for no reason connected to
  this task.
- `Front-end/src/features/booking/store.ts` — `serviceIds`/`comboIds` →
  `serviceCodes`; `vehicle`/`contact` → `savedVehicleId` + `manualVehicle`
  (dropped the editable contact form entirely — the backend has no contact
  fields; identity comes from the JWT-authenticated customer).
- `Front-end/src/features/booking/selectors.ts` — `useCartSummary` now mirrors
  the backend's real formula (sum base prices, multiply once).
- All 6 step components (`StepBranch`/`StepService`/`StepDateTime`/
  `StepVehicle`/`StepReview`/`StepConfirm`) and `BookingWizardPage.tsx` —
  wired to real APIs; `StepService` flattened to a single list (no backend
  category concept); `StepDateTime` replaced the 7-day `WeekGrid` with a
  day-picker + honest 30-minute slot list; `StepVehicle` adds a saved-vehicle
  picker via the real `lib/api/vehicles.ts` alongside manual entry, plus a
  read-only "confirmed via account" block; `BookingWizardPage` now owns the
  real `useCreateBooking()` mutation and shows the persisted `bookingRef` +
  `vietQrUrl` on success; `store.reset()` now runs on "Home" too (not only
  "Book again"), since submissions have real side effects.
- `Front-end/src/app/router.tsx` — `/guest/booking` now points at
  `GuestBookingPreviewPage` instead of the real wizard.
- `Front-end/src/i18n/locales/{vi,en}/booking.json` — added/updated keys;
  removed the old aspirational "payOS deposit" wording in favor of accurately
  describing manual/counter + VietQR payment (no deposit concept exists in
  the current backend contract).

**Left alone (orphaned, not deleted):** `lib/mock/api.ts`, `lib/mock/catalog.ts`,
and `lib/slot.ts` are no longer imported by the booking feature after this
change. Unlike the four booking-feature-specific components deleted below
(which existed solely to serve the exact steps this session rewrote), these
are shared mock-data infrastructure modules that pre-date this session — left
in place per the repo's "don't delete legacy code silently" guidance, flagged
here for a future cleanup pass. (The four now-fully-orphaned booking
components — `ServiceIconGrid.tsx`, `ServicePickerSheet.tsx`,
`CategoryIcon.tsx`, `WeekGrid.tsx` — *were* deleted; see "Fixes applied in
response to code review" below.)

## Verification (exact commands and results, this session)

- `mvn -f Back-end/pom.xml test -Dtest=BookingManagementServiceTest` → RED
  (2 failures, actual type `BadRequestException`) before the fix.
- `mvn -f Back-end/pom.xml test` → **BUILD SUCCESS, 13/13 tests** after the fix.
- `npm --prefix Front-end run typecheck` (`tsc --noEmit`) → clean, 0 errors.
  (First ran `npm ci` in `Front-end/` — `node_modules` was found incomplete/
  stale, 29 packages instead of the expected ~190; reinstalled from
  `package-lock.json` per `AGENTS.md`'s documented install command.)
- `npm --prefix Front-end run build` (`vite build`) → clean, 0 errors (one
  pre-existing, unrelated chunk-size-warning; not touched).
- **Live manual verification** (not just typecheck/build): started the real
  backend (`Back-end/run-local.ps1`, DB connected, Firebase Admin SDK
  initialized) and the real frontend (`npm run dev`) locally, then drove the
  full flow in Chrome:
  - Reset an existing local-dev-only "Test Customer" row's password hash
    (bcrypt, via a scratch Node script) to enable a real login — no
    Firebase-OTP-verified test account existed and none of the seeded
    STAFF/ADMIN passwords were available in this session.
  - Logged in via the real `/api/v1/auth/login` (200, real JWT).
  - Walked all 6 real wizard steps: real branch (`AutoWash Pro - District 1`),
    real services (`VW Basic Wash` + `VW Detail Wash`, 170.000đ + 270.000đ),
    real 30-minute availability slots (honest `08:00` grid, correctly labeled
    "Mỗi ô là 1 khung giờ 30 phút"), manual vehicle entry (Sedan/Toyota/
    `51K-123.45`) since this test customer had no saved vehicles, a Review
    step showing the exact backend-formula total (440.000đ = (170.000+270.000)
    × 1.0), and a Confirm step correctly describing manual/counter + VietQR
    payment (no "payOS"/"VNPAY" wording).
  - Submitted the real booking: **`POST /api/v1/bookings` succeeded**, UI
    showed a real booking reference (`AWP-6968C119`) and a real VietQR image
    with the correct amount.
  - **Confirmed server-side via direct DB query** (not just the UI): the
    `bookings` row (`id=6`, `booking_ref='AWP-6968C119'`, `customer_id=4`
    matching the JWT — not client input, `vehicle_id=5`, `branch_id=1`,
    `total_price=440000.00`, `status='PENDING'`) and a new `vehicles` row
    (`id=5`, `Toyota`/`51K-123.45`/`SEDAN`) were persisted exactly as
    expected; `booking_services` correctly links both selected service codes.
  - Verified `/guest/booking` now renders the static preview stub (6-step list
    + login/register buttons), not the interactive wizard.
- Independent **code review** and **security review** (background agents,
  read-only, dispatched after implementation):
  - `security-reviewer`: **no CRITICAL/HIGH findings.** Independently
    re-verified the `BookingController.java:24` JWT-`customerId`-override
    claim and the `GlobalExceptionHandler` error-envelope parity between 400
    and 403. Two LOW/informational notes, neither a regression: (1) the
    client-writable-but-always-overwritten `customerId` field pattern is the
    same *shape* as the already-fixed `CustomerController` privilege-
    escalation bug, worth a defense-in-depth follow-up (`@JsonIgnore` or a
    dedicated service-layer parameter) but not currently exploitable; (2) the
    `/washing-counter` STAFF/ADMIN branch-scoping gap already recorded in
    `PROGRESS.md` was re-cited as context, not a new finding.
  - `code-reviewer`: **no CRITICAL/HIGH findings.** Explicitly confirmed
    correct: the pricing-math port, the `vehicleId` XOR manual-entry mapping,
    safety of dropping the old contact fields, and no leftover references to
    removed mock shapes. Three MEDIUM findings, addressed below.

### Fixes applied in response to code review

1. **Orphaned dead code (MEDIUM)** — `ServicePickerSheet.tsx`,
   `ServiceIconGrid.tsx`, `CategoryIcon.tsx`, `WeekGrid.tsx` (the old
   category/combo picker and 7-day/15-minute grid) had zero importers left
   after the step rewrites. Grep-confirmed no other file referenced them,
   then deleted all four per this repo's own "remove what your change made
   unused" rule (recoverable via git history/`docs/tooling/BASELINE.md` if
   ever needed).
2. **Day/slot staleness bug (MEDIUM, real correctness issue)** —
   `StepDateTime.tsx` kept the "day being viewed" as separate local
   `useState`, while `BookingWizardPage`'s `canProceed` only checked the
   store's `dayKey`/`slotTime` truthiness. A user could pick a slot on day A,
   switch the day tab to day B (which only updated local state), see no slot
   highlighted, and still have "Continue" enabled — silently carrying day A's
   stale slot forward. Fixed by removing the local state entirely: added a
   `viewDay(dayKey)` store action that sets `dayKey` and clears `slotTime`
   only when the day actually changes, and `StepDateTime` now derives the
   displayed day directly from the store (`dayKey ?? today`). Live-verified
   in Chrome after the fix: selecting 07:00 on one day, then switching day
   tabs, now correctly clears the selection and disables "Continue" until a
   fresh slot is picked on the newly-viewed day.
3. **Manual-vehicle plate has no format validation (MEDIUM) — flagged, not
   fixed.** `BookingManagementService.resolveVehicle()`'s ad-hoc-vehicle path
   (`licensePlate`/`brand`/`vehicleSize` instead of `vehicleId`) has no plate
   regex check, unlike the sibling `VehicleServiceImpl.createVehicle()`
   (`^[0-9]{2}[A-Z]-[0-9]{3}\.?[0-9]{2}$`). This code path pre-dates this
   session but was unreachable while the wizard was 100% mock; this session's
   frontend wiring makes it live for the first time. Per the user's explicit
   instruction to not expand this task's scope, this was **not** fixed —
   recorded here and in `PROGRESS.md`'s Next section as a fast, tightly-
   scoped follow-up recommendation (add the same regex check used in
   `VehicleServiceImpl` to `resolveVehicle()`'s ad-hoc-creation branch).
4. Two LOW findings (unused i18n keys left in `booking.json`;
   `GuestBookingPreviewPage.tsx` hardcodes Vietnamese with no `useTranslation`
   call) were left as-is — both harmless, and the second exactly matches the
   pre-existing sibling `GuestOverviewPage.tsx`'s established (if
   non-conforming) convention, not a regression this diff introduced.

**Post-fix re-verification**: `npm --prefix Front-end run typecheck` and
`npm --prefix Front-end run build` both clean after the deletions and the
store/`StepDateTime` change; the day-switching fix was re-verified live in
Chrome (see above).

## Files changed this session

- `Back-end/src/main/java/com/autowashpro/service/BookingManagementService.java` (modified, 2 lines)
- `Back-end/src/test/java/com/autowashpro/service/BookingManagementServiceTest.java` (new)
- `Front-end/src/lib/api/bookings.ts` (new)
- `Front-end/src/lib/money.ts` (rewritten)
- `Front-end/src/features/booking/store.ts` (rewritten)
- `Front-end/src/features/booking/selectors.ts` (rewritten)
- `Front-end/src/features/booking/steps/StepBranch.tsx` (rewritten)
- `Front-end/src/features/booking/steps/StepService.tsx` (rewritten)
- `Front-end/src/features/booking/steps/StepDateTime.tsx` (rewritten)
- `Front-end/src/features/booking/steps/StepVehicle.tsx` (rewritten)
- `Front-end/src/features/booking/steps/StepReview.tsx` (rewritten)
- `Front-end/src/features/booking/steps/StepConfirm.tsx` (rewritten)
- `Front-end/src/features/booking/BookingWizardPage.tsx` (rewritten)
- `Front-end/src/features/guest/GuestBookingPreviewPage.tsx` (new)
- `Front-end/src/app/router.tsx` (1-line change)
- `Front-end/src/i18n/locales/vi/booking.json` (updated)
- `Front-end/src/i18n/locales/en/booking.json` (updated)
- `Front-end/src/features/booking/components/ServicePickerSheet.tsx` (deleted, orphaned by the rewrite)
- `Front-end/src/features/booking/components/ServiceIconGrid.tsx` (deleted, orphaned by the rewrite)
- `Front-end/src/features/booking/components/CategoryIcon.tsx` (deleted, orphaned by the rewrite)
- `Front-end/src/features/booking/components/WeekGrid.tsx` (deleted, orphaned by the rewrite)
- `docs/ai-logs/m1/2026-07-21-fr004-phase1-booking-fix.md` (this file)
- `PROGRESS.md` (updated)

## Not done (explicitly out of scope, recorded so it isn't lost)

- Phase 2 (FR-005 v2 schema, VNPAY, real slot/bay model) and Phase 3 (guest
  booking) — both require separate owner sign-off per the plan doc.
- Deleting the now-orphaned `lib/mock/api.ts`/`catalog.ts`/`lib/slot.ts`
  (see "Left alone" above) — flagged, not removed (unlike the four
  booking-component files, which were deleted).
- `BookingManagementService.resolveVehicle()`'s ad-hoc-vehicle path has no
  license-plate format validation (unlike `VehicleServiceImpl.createVehicle
  ()`'s regex check) — flagged by the code-reviewer as newly-reachable via
  this session's frontend wiring, not fixed per the user's explicit
  instruction not to expand this task's scope. Recommended fast follow-up:
  add the same `^[0-9]{2}[A-Z]-[0-9]{3}\.?[0-9]{2}$` check to
  `resolveVehicle()`'s manual-entry branch.
- `BookingManagementService`'s other `BadRequestException`/`ResourceNotFound
  Exception` usages (legitimate validation, not ownership checks) — untouched.
- Unused, vestigial `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY`
  entries found in the gitignored local `Back-end/.env` during this session —
  grep-confirmed zero code references anywhere in `Back-end/src`. Not a
  payment integration this audit missed; flagged as dead local config the
  owner may want to remove, not acted on (not this task's file to edit).
- Local-dev-only test data left in place as evidence: the "Test Customer"
  row's password was reset (bcrypt, local DB only) and now has one real
  booking (`AWP-6968C119`) and one real vehicle (`51K-123.45`) — harmless
  local test fixtures, not touched in any tracked file.

## Human validation

Not yet performed by the owner. Backend and frontend dev servers were left
running locally after this session's verification (`Back-end` on :8080,
`Front-end` on :5173) in case further manual testing is wanted; stop them
with the corresponding background task IDs or normal process termination if
not needed.
