<<<<<<< HEAD
=======
<<<<<<< Updated upstream
# Technical Specification: [FR-002] Customer Login & Account Linking

## Purpose

Customers authenticate through Firebase Phone OTP or Google Sign-In. Both methods resolve to the same account when their verified identity matches an existing phone number or email.

## Functional Rules

- The login screen offers Phone OTP and Google Sign-In; a password-only flow is not an alternative authentication method in v2.
- Firebase verifies the selected provider. The backend verifies the Firebase identity token before issuing application credentials.
- Google users without a phone number may sign in, but must supply one before their first booking.
- Account linking follows the uniqueness rules for phone and email and never silently creates a duplicate account.

## API and Security

- `POST /api/v1/auth/login` accepts the verified Firebase identity token and returns the matching application account and access token.
- The endpoint does not issue staff or admin credentials through the customer portal.
- Invalid, expired, or mismatched Firebase tokens return `401 Unauthorized`; invalid input returns `400 Bad Request`.

## UX and Acceptance Criteria

- Show provider-specific loading, retry, and error states; disable a provider button while its request is in progress.
- Given a verified identity that matches an existing account, login returns that account.
- Given an unregistered identity, login directs the customer to registration without creating a duplicate record.
- Given a Google-only account, the booking flow requires a phone number before booking confirmation.

## Source Rules

[BR-034](../refactor/06-BUSINESS-RULES-V2.md).
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
# Technical Specification: [FR-002] Customer Login

## Purpose

Customers authenticate with the phone number and password they set at
registration (FR-001), verified against the backend's own bcrypt-hashed
credential store. Firebase and Google Sign-In play **no role in login** — they
are used only once, during registration, to verify identity ownership.

## Current Implementation (as of 2026-07-21)

- The login screen offers a single phone + password form
  (`LoginPage.tsx`, mode `'login'`). There is no Firebase/Google option at
  login; password-based login is the *only* login method, not an alternative
  to one.
- `POST /api/v1/auth/login` accepts `{ phone, password }` and returns
  `{ token, customer }` on success. `AuthServiceImpl.login` looks the phone up
  directly and compares the password against `passwordHash` with
  `PasswordEncoder.matches` — no Firebase call is made.
- A missing phone or a password mismatch both return the same generic
  `401 Unauthorized` message ("Incorrect phone number or password."), so the
  response does not reveal whether the phone is registered.
- Missing/blank request fields return `400 Bad Request` via bean validation.
- The endpoint **does** issue STAFF and ADMIN JWTs, not just CUSTOMER ones:
  STAFF/ADMIN accounts are rows in the same `customers` table with a different
  `role` value, and `login()` has no role filter — it authenticates any
  `Customer` row and stamps the JWT with that row's `role`. There is no
  separate staff/admin login endpoint or portal.

## Deliberate Deviations from the Original v2 Design (Owner-Approved)

The owner made an explicit product decision (chat, 2026-07-21, formalized in
[docs/superpowers/specs/2026-07-21-google-signin-registration-design.md](../superpowers/specs/2026-07-21-google-signin-registration-design.md))
that supersedes this document's original "Firebase Phone OTP or Google
Sign-In" login rule:

- **Google Sign-In is registration-only, deliberately not a login method.**
  Once an account exists (however it was created), phone+password is the only
  login path — kept as exactly one login code path instead of two. Firebase
  is used only for the one-time identity check during registration (see
  FR-001).
- **Account linking on login does not apply**, since there is no
  identity-token-based login path to resolve to an existing account (see
  FR-001's equivalent decision on registration-time account linking).

## Acceptance Criteria

1. Given a phone and password matching a stored account, login returns a JWT
   and the customer's profile (`id`, `name`, `phone`, `tier`, `role`,
   `accumulatedPoints`, `totalSpend`).
2. Given an unregistered phone or an incorrect password, login returns
   `401 Unauthorized` with a generic message that does not distinguish the two
   cases.
3. Given a STAFF or ADMIN phone/password, login succeeds through this same
   endpoint and returns a JWT carrying that role.
4. Given a request missing `phone` or `password`, login returns
   `400 Bad Request`.

## Source Rules

[BR-034](06-BUSINESS-RULES-V2.md) (corrected path — the original
`../refactor/...` link was dangling; no `docs/refactor/` directory exists in
this repository). This source document describes the original aspirational
Firebase-identity login design; see "Deliberate Deviations" above for where
<<<<<<< HEAD
the current implementation diverges from it.
=======
the current implementation diverges from it.
>>>>>>> Stashed changes
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
