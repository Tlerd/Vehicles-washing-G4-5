# Technical Specification: [FR-001] Customer Registration & Identity Verification

## Purpose

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