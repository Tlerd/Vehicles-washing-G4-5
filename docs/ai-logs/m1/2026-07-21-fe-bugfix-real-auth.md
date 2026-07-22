# AI log — 2026-07-21 — Real backend auth + bug fixes (post-Phase-2 user testing)

## Task
Owner tested the Phase 2 build against the real (already-existing) backend and
reported: login has no password field; a past-calendar-date bug; a UI column
overflowing its border; vehicle creation needs a brand picker; booking contact
info is missing an email field; and asked for the two non-customer roles to be
provisioned in the database with credentials reported back. Ultracode was on;
owner explicitly asked for sub-agent use.

## Human validation
Owner provided real login credentials for their own CUSTOMER account
(0373825237) in chat to enable testing, and explicitly authorized creating the
other two role accounts and reporting the passwords back. Three reference
images for the requested brand-picker UI did not attach to the message (only
placeholders arrived) — proceeded with a reasonable default Vietnam-market
brand list per instruction to ask when missing info, flagged for the owner to
adjust once resent.

## Key finding: architecture mismatch
The backend (already running, pre-existing) has its own complete phone+
password JWT auth (`POST /api/v1/auth/login`, `POST /api/v1/auth/register`)
fully independent of Firebase as a session mechanism — Firebase is used only
to verify phone ownership during registration (`RegisterRequest.firebaseToken`,
verified server-side via Firebase Admin SDK, checked against the `phone_number`
claim). Phase 2's LoginPage was built Firebase-only (no password field at
all), which is the literal bug reported ("lỗi đăng nhập không có mật khẩu").
Confirmed via direct `curl` against the live backend that the owner's account,
and both seeded STAFF/ADMIN accounts, all authenticate correctly against the
real endpoint before any FE changes were made.

## What was done
<<<<<<< HEAD
- **Password rotation (STAFF/ADMIN)**: `SystemAccountSeeder.java` previously
  auto-seeded two privileged accounts with tracked legacy credentials (values
  redacted from the working tree) on
=======
- **Password rotation (STAFF/ADMIN)**: `SystemAccountSeeder.java` already
  auto-seeds `+84900000001`/`Staff@123` and `+84900000002`/`Admin@123` on
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
  every backend startup (idempotent) — these are hardcoded in tracked source,
  a pre-existing security-blocker finding. Generated two fresh bcrypt hashes
  (Python `bcrypt`, rounds=10, matching Spring's `BCryptPasswordEncoder`),
  updated both DB rows directly, verified all three accounts (CUSTOMER, STAFF,
  ADMIN) log in successfully against the live backend before/after.
- **Real auth rebuild**: `lib/api/client.ts` (fetch wrapper + Bearer token),
  `lib/api/auth.ts` (login/register), `AuthContext` rewritten to a
  localStorage-persisted backend JWT session (no longer Firebase
  `onAuthStateChanged`). `LoginPage` rebuilt: phone+password login as the
  primary tab; a 3-step register tab (send OTP → confirm OTP for a Firebase ID
  token → collect name/password/email → register then auto-login). Removed
  the Google Sign-In option — it doesn't fit this backend's register contract
  (requires a Firebase ID token with a `phone_number` claim, which a Google
  popup doesn't provide) rather than leave a button that would silently fail.
- **Real vehicle API**: `lib/api/vehicles.ts` (CRUD against
  `/api/v1/vehicles`, JWT-scoped server-side). `GaragePage`,
  `VehicleFormSheet`, `VehicleCard` rewired from the Phase 2 mock data to this
  real API. Found and fixed a real backend data inconsistency during
  verification: the API returns `vehicle.size` in lowercase (`"sedan"`) while
  the Java `VehicleSize` enum is uppercase (`SEDAN`) — normalized case at the
  single mapping boundary (`lib/api/vehicles.ts`) so i18n lookups and the edit
  form's `<select>` both work regardless of the source casing.
- **Vehicle brand picker**: `features/customer/vehicleBrands.ts`, a curated
  20-brand Vietnam-market list, wired into `VehicleFormSheet` as a `<Select>`
  feeding the real `brand` field.
- **Workflow-dispatched fixes** (3 tasks, pipelined build→independent-verify,
  6 agents total): WeekGrid rebuilt from a `<table>` to CSS Grid (sticky
  cells on table cells are unreliable across browsers) — the verify stage
  confirmed this via code read + `tsc`, correctly; VN-timezone fix (BR-027) —
  `lib/datetime.ts`'s `todayStart()`/`upcomingDays()` now use
  `date-fns-tz`'s `toZonedTime` against `Asia/Ho_Chi_Minh` explicitly instead
  of the browser's OS-local timezone, and the decorative landing-page
  `BookingWidget`'s native date-input `min` (which used UTC via
  `toISOString()`, wrong during Vietnam's 00:00–06:59 window) now reuses that
  same VN-correct date; contact-info email field added end-to-end
  (`ContactInfo` type, `StepVehicle`, `StepReview`, both locale files),
  optional, doesn't block wizard progression.
- **Bug found AFTER the workflow's own "PASS" verification, by direct browser
  testing**: the WeekGrid rebuild alone did not fully fix the reported
  overflow — live DOM/geometry inspection showed the real cause was a
  z-index/stacking conflict between WeekGrid's sticky cells (z-10/z-20) and
  `BookingWizardPage`'s own `sticky bottom-0` footer, which had no explicit
  z-index and was letting grid content paint on top of it near the bottom of
  the scroll area. Fixed directly: added `z-30` to the footer. This is called
  out explicitly because it shows the gap between a code-level review passing
  and an actual runtime visual check — the workflow's verify agents correctly
  confirmed the table→grid rebuild was sound, but none of them loaded the
  page in a browser, so the real remaining bug wasn't caught until manual
  testing here.

## Evidence
- `curl` against the live backend confirmed login for all 3 roles both before
  any FE changes and after the password rotation.
- `npx tsc --noEmit` and `npm run build` clean (0 errors) after every stage:
  initial auth rebuild, garage rewire, workflow merge, and the final z-index
  fix — checked repeatedly, not just once at the end.
- Browser (Claude-in-Chrome), dev server :5174, logged in with the owner's
  real credentials (0373825237): Dashboard reachable (still shows mock name
  "Nguyễn Văn A" — see Rejected/deferred below); Garage shows the two real
  vehicles from the database (Toyota 47S-32567, Ford 47A-23582); created a
  real third vehicle via the new brand picker, confirmed it persisted via a
  page reload and a raw API query, then deleted it via the UI to leave the
  account clean; size-label i18n bug found and fixed live during this same
  check. WeekGrid overflow bug reproduced precisely via DOM geometry queries
  (`getBoundingClientRect()` on the sticky time-label vs. the footer), fixed,
  and re-verified geometrically clean plus visually via screenshot. Email
  field confirmed present and correctly placed in the contact info card. No
  console errors on any checked route in this session.

## Accepted
All of the above.

## Rejected / deferred
- **Dashboard, Points, Vouchers, History, BookingDetail still read
  `lib/mock/customerApi.ts`'s fake profile/bookings**, now visibly
  inconsistent with the real authenticated session (confirmed live: greeting
  shows "Nguyễn Văn A", not the real account's name). Only Garage was migrated
  to the real API this session, because that's specifically where the owner's
  bug report pointed (vehicle creation). Migrating the rest to real
  bookings/points/vouchers endpoints is a real, known gap — flagged to the
  owner, not silently left ambiguous. The real backend's booking/points/
  voucher endpoints were not inventoried this session; that's the next step
  before attempting the migration.
- Vehicle brand list is a reasonable default (20 common VN-market brands), not
  the owner's actual reference — the 3 images they intended to send never
  attached. Easy to swap in `features/customer/vehicleBrands.ts`.
- Google Sign-In removed rather than fixed — the current backend contract has
  no path for it (register requires a phone-verified Firebase token). Would
  need a backend contract change to support, out of scope here.
- No git commit made (not requested this session).

## Related files
`Front-end/src/lib/api/**`, `Front-end/src/features/auth/**`,
`Front-end/src/features/customer/{pages/GaragePage.tsx,components/Vehicle*,vehicleBrands.ts}`,
`Front-end/src/features/booking/{BookingWizardPage.tsx,components/WeekGrid.tsx,steps/StepVehicle.tsx,steps/StepReview.tsx}`,
`Front-end/src/features/landing/components/BookingWidget.tsx`,
`Front-end/src/lib/datetime.ts`, `Front-end/src/types/index.ts`,
`Front-end/src/i18n/locales/**`, database `customers` table (STAFF/ADMIN
password rotation).
