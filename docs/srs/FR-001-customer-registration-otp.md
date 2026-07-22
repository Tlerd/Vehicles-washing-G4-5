# Technical Specification: [FR-001] Customer Registration & Identity Verification

## Purpose

<<<<<<< HEAD
=======
<<<<<<< Updated upstream
Customers register with **one** Firebase identity provider: Phone OTP or Google Sign-In. The system links matching identities to one account and prevents duplicate phone numbers or email addresses.

## Functional Rules

- Phone OTP verifies the phone number. Google Sign-In verifies the email address.
- A Google user must add a phone number before their first booking.
- A phone number or email that already belongs to a user links to that user; it must not create a second account.
- Phone values use E.164. The client converts Vietnamese local input such as `0901234567` to `+84901234567` before Firebase verification.
- Database constraints: `UNIQUE(phone) WHERE phone IS NOT NULL` and `UNIQUE(email) WHERE email IS NOT NULL`.

## Roles and UI

- Anonymous users may start Phone OTP or Google Sign-In.
- The registration screen presents both methods, a resend countdown for OTP, provider-specific loading/error states, and a follow-up phone field for Google users without a phone number.
- Registration completion is disabled until a valid Firebase identity token is available.

## Backend Contract

- `POST /api/v1/auth/register` accepts the verified Firebase identity token and profile information required by the selected provider.
- The backend verifies the Firebase token, validates the corresponding phone or email, applies account linking, then returns the authenticated account.
- Invalid/expired identity tokens and duplicate identities that cannot be safely linked return `400 Bad Request`; unauthenticated calls return `401 Unauthorized`.

## Acceptance Criteria

1. Given a valid Vietnamese phone number, when the customer requests OTP, then the client submits the E.164 phone number to Firebase and starts the resend countdown.
2. Given a verified Phone OTP or Google identity, when registration completes, then exactly one customer account is returned.
3. Given Google Sign-In without a phone number, when the customer attempts the first booking, then the system requires the phone number before continuing.
4. Given a phone or email already linked to an account, when the same person uses the other provider, then the system links the identity instead of creating a duplicate account.

## Source Rules

[BR-015 and BR-034](../refactor/06-BUSINESS-RULES-V2.md) and [the v2 plan](../refactor/PLAN-V2-LAM-LAI-FE.md).
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
Customers register with a phone number and password, which become their permanent
login credential (`POST /api/v1/auth/login`, see FR-002). Firebase Phone OTP or
Google Sign-In is used only once, at registration time, to prove the customer
controls the phone number or email they are submitting — it is not the ongoing
authentication mechanism and issues no session by itself.

## Current Implementation (as of 2026-07-21)

- The client always collects name, phone, and password (min 6 characters), plus
  an optional email, regardless of which Firebase method verified the identity.
- **Phone OTP path:** Firebase verifies the submitted phone number. The backend
  (`AuthServiceImpl.register`) rejects the request with `400 Bad Request` if the
  Firebase-verified phone does not match the submitted phone.
- **Google Sign-In path:** Firebase verifies the Google account's email. The
  phone number is *not* verified by Firebase in this path — the customer types
  it directly into the same registration form and the backend trusts it as-is
  (subject only to the uniqueness check below).
- Phone values use E.164. The client converts Vietnamese local input such as
  `0901234567` to `+84901234567` before calling Firebase and before calling the
  backend.
- Duplicate phone or duplicate email (`UNIQUE(phone)`, `UNIQUE(email)` where not
  null) returns `409 Conflict`. An invalid/expired Firebase token, or a
  submitted phone/email that mismatches the Firebase-verified identity, returns
  `400 Bad Request`.
- `POST /api/v1/auth/register` returns only `{ success, customerId }` — no JWT.
  The frontend immediately calls `POST /api/v1/auth/login` with the same
  phone/password right after a successful register to establish a session
  (`LoginPage.tsx: handleCompleteRegistration`).

## Deliberate Deviations from the Original v2 Design (Owner-Approved)

The owner made explicit product decisions (chat, 2026-07-21, formalized in
[docs/superpowers/specs/2026-07-21-google-signin-registration-design.md](../superpowers/specs/2026-07-21-google-signin-registration-design.md))
that intentionally supersede two rules in this document's original v2 text.
These are approved scope decisions, not unfinished work:

- **No deferred phone for Google users.** The original rule ("a Google user
  must add a phone number before their first booking") is superseded: phone
  and password are collected immediately during Google sign-up instead, to
  avoid a nullable-phone account state and a booking-time gate. That phone
  number is validated only for format, not Firebase-verified (acceptable per
  the owner's explicit choice).
- **No account linking.** `register()` only checks for duplicate phone/email
  and rejects them with `409 Conflict`; it deliberately does not attach a
  second identity provider to an existing account. Full identity-merge was
  assessed as materially larger and more security-sensitive, and was
  explicitly scoped out.

## Acceptance Criteria

1. Given a valid Vietnamese phone number, when the customer requests OTP, then
   the client submits the E.164 phone number to Firebase and starts the resend
   countdown.
2. Given a verified Phone OTP identity, when registration completes, then the
   submitted phone must equal the Firebase-verified phone, or the request is
   rejected with `400 Bad Request`.
3. Given a verified Google identity, when registration completes, then the
   backend uses the Firebase-verified email (or rejects a mismatching
   submitted email with `400 Bad Request`) and requires a directly-submitted,
   unverified phone number — a deliberate deviation from deferring to first
   booking (see "Deliberate Deviations" above).
4. Given a phone or email already registered, when either provider is used
   again with that value, then the request is rejected with `409 Conflict` —
   it deliberately does not link to the existing account (see "Deliberate
   Deviations" above).
5. Registration alone does not create a session; the client must call
   `POST /api/v1/auth/login` with the submitted phone/password afterward.

## Source Rules

[BR-015 and BR-034](06-BUSINESS-RULES-V2.md) and [the v2 plan](../plans/PLAN-V2-LAM-LAI-FE.md)
(corrected paths — the original `../refactor/...` links were dangling; no
`docs/refactor/` directory exists in this repository).
These source documents describe the original aspirational design; see
"Deliberate Deviations" above for where the current implementation diverges
<<<<<<< HEAD
from them.
=======
from them.
>>>>>>> Stashed changes
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
