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