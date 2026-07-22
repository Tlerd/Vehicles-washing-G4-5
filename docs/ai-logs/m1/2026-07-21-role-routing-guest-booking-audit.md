# Role Routing and Guest Booking Audit

Date: 2026-07-21

## Requested scope

- Correct landing entry points and role-specific post-authentication routing.
- Replace the landing `Book now` header button with a person-icon overview
  entry point for guests.
- Send public booking calls straight to the guest booking flow.
- Restore the vehicle-brand list in the booking wizard.
- Assess whether the backend SQL schema should change for the guest direction.

## Accepted changes

- Added a single frontend role-to-home mapping: CUSTOMER `/app`, STAFF
  `/staff`, and ADMIN `/admin`.
- Login and the post-registration session now redirect to that role home rather
  than the landing modal's former `/booking` return path.
- Added explicit Guest, Staff, and Admin overview routes. `CustomerLayout`
  rejects STAFF and ADMIN sessions, preventing them from viewing customer
  console routes.
- Changed landing-page booking CTAs to `/guest/booking`; they no longer open
  the sign-in/register/guest choice modal. Existing customer-console booking
  CTAs use `/app/booking`.
- Replaced the landing header CTA with a labelled person icon linking to
  `/guest`.
- Added the existing curated `VEHICLE_BRANDS` list as a required dropdown in
  the booking wizard and preserved the separate model field.
- Removed the unused modal/context implementation that hard-coded the invalid
  return route.

## Rejected SQL change and blocker

An initial guest-booking SQL migration was rejected and removed during review.
The current backend accepts bookings only for an authenticated CUSTOMER/STAFF/
ADMIN principal, always resolves a `Customer` plus persistent `Vehicle`, and
its JPA/loyalty/admin code dereferences both relationships. The UI wizard is
currently mock-only and does not POST a booking. Making the database foreign
keys nullable without implementing a separate validated guest booking API,
guest OTP verification, null-safe response/operations logic, and a rule that
guests receive no loyalty or voucher benefits would introduce data corruption
and runtime failure risk.

No vehicle-brand lookup table was added: the approved FR-003 requires a
brand/model value but does not define an admin-managed brand catalogue.

## Evidence

- `npm --prefix Front-end run typecheck` — exit 0.
- `npm --prefix Front-end run build` — exit 0 (Vite 6.4.3). Build reports its
  existing large JavaScript chunk warning.
- `mvn -f Back-end/pom.xml test` — exit 0; 7 tests run, 0 failures, 0 errors,
  0 skipped (`AuthServiceImplTest`).
- `git diff --check` — exit 0.
- Browser E2E was not run: no controllable browser was available in this
  runtime. The user-provided screenshot was visually reviewed.

## Independent reviews

- Frontend review confirmed the former hard-coded `/booking` return route,
  missing role routes, missing customer role guard, and missing wizard brand
  picker.
- Code review and security review both identified that guest SQL persistence
  would be incompatible with the current authenticated member-only booking
  backend; the schema change was removed.

## Follow-up required

Implement the separate, security-reviewed guest booking API and OTP-verification
flow before treating `/guest/booking` confirmation as a persisted booking or
changing the backend schema for anonymous bookings.
