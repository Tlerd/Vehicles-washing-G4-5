# Design: Google Sign-In as a registration path

- Date: 2026-07-21
- Status: Approved by owner (chat), Phase 1 (FR-001) work item
- Related: docs/srs/FR-001-customer-registration-otp.md,
  docs/srs/FR-002-customer-login.md,
  docs/ai-logs/m1/2026-07-21-fr001-013-audit-and-phase0.md

## Context

The FR-001/FR-002 audit found Google Sign-In implemented in
`Front-end/src/lib/firebase.ts` (`signInWithGoogle()`) but never called from
any UI, and the approved FR-002 doc's "Firebase-token-only login, no
password" requirement contradicts the real, working phone+password login. The
owner made three explicit product decisions (chat, 2026-07-21) that this spec
formalizes:

1. **Login stays phone+password.** FR-002's doc will be corrected separately
   to describe the real design (out of scope for this spec — a docs-only
   change, not implementation). Registration keeps requiring Firebase Phone
   OTP verification before an account is created with a password, which is
   already true today.
2. **Google Sign-In is registration-only.** No "Sign in with Google" button
   for returning users — once an account exists (however it was created), the
   only login method is phone+password. This keeps exactly one login code
   path instead of two.
3. **Phone + password are collected immediately during Google sign-up**, not
   deferred to "before first booking" as FR-001's literal text allows. This
   avoids a nullable-phone account state and a booking-time gate — smaller,
   safer scope.
4. **Duplicate phone or email is rejected with a conflict error**, not
   auto-linked to an existing account. Full identity-merge (combining two
   people's bookings/points/vouchers) is a materially larger, more
   security-sensitive feature and is explicitly out of scope here.

## Goal

A visitor on the registration screen can create an account either via Phone
OTP (existing, unchanged) or via Google Sign-In (new): Google verifies their
email, then the same screen asks for phone number + password before the
account is created — arriving at the same kind of account either way.

## Non-goals

- Google Sign-In as a login method for existing accounts.
- Deferred/optional phone numbers on any account.
- Automatic account linking/merging on duplicate identity.
- Rewriting login to be Firebase-token-based (that's a separate, not-yet-
  approved decision covered by the FR-002 doc correction, not this spec).

## Backend design

### Why extend `/api/v1/auth/register` instead of adding a new endpoint

Firebase Admin SDK already disambiguates the two providers inside the
verified token itself: a Phone-OTP token's decoded claims include
`phone_number`; a Google-OAuth token's claims include `email` (and no
`phone_number`). `AuthServiceImpl.register()` can branch on which claim is
present rather than trusting a client-declared "provider" field or existing
as a duplicate endpoint. A separate endpoint would duplicate the identical
"create Customer, hash password, issue welcome voucher" logic for no benefit
— rejected per DRY/YAGNI.

### `AuthServiceImpl.register()` changes

Current flow (unchanged for the phone path):
1. Reject if `existsByPhone(phone)`.
2. Verify `firebaseToken` via `FirebaseAuth.verifyIdToken()`.
3. Require the token's `phone_number` claim to match the submitted phone
   (E.164-normalized on both sides).
4. Create the `Customer`, hash the password, save a welcome voucher.

New flow:
1. Reject if `existsByPhone(phone)` **or `existsByEmail(email)` when email is
   present** (new `CustomerRepository.existsByEmail(String)` derived query).
2. Verify `firebaseToken`.
3. Branch on the decoded token's claims:
   - `phone_number` present → today's cross-check (unchanged).
   - `phone_number` absent, `email` present (from `decodedToken.getEmail()`)
     → Google path. The submitted `phone` is validated by the existing
     `@Pattern` on `RegisterRequest.phone` (format only, not
     Firebase-verified — acceptable since the owner chose "collect
     immediately" over a verified-phone requirement at Google sign-up). If
     the request supplied an `email`, it must match the token's verified
     email (case-insensitive); if not supplied, the token's email is used.
   - Neither claim present → `BadRequestException` (same class used for
     other invalid-token cases today).
4. Create the `Customer` exactly as today (no entity/schema changes needed —
   `email`, `phone`, `passwordHash` are already all populated the same way
   regardless of path).

No changes to `RegisterRequest` (already has `name`, `phone`, `password`,
optional `email`, `firebaseToken` — sufficient for both paths) and no schema
migration needed.

### Testability refactor (enables TDD for this change)

`FirebaseAuth.getInstance().verifyIdToken(...)` is called as a static method,
which plain Mockito cannot stub. Introduce:

```java
public interface FirebaseTokenVerifier {
    FirebaseToken verify(String token) throws FirebaseAuthException;
}
```

with a `@Component` implementation that delegates to the static call, injected
into `AuthServiceImpl` via constructor (replacing the direct static call).
This is the smallest change that makes the new branching logic — and the
existing phone-verification logic — unit-testable without a Spring context or
a real Firebase project. This is the first file under `Back-end/src/test`.

### Tests (`AuthServiceImplTest`, Mockito, no Spring context)

- Existing phone-OTP registration still creates an account and matches phone.
- Phone-OTP registration rejects when the token's `phone_number` doesn't
  match the submitted phone (existing behavior, now covered).
- Google registration (token has `email`, no `phone_number`) creates an
  account using the submitted phone and the token's email.
- Google registration rejects when the submitted email doesn't match the
  token's verified email.
- Duplicate phone rejected (existing behavior, now covered).
- Duplicate email rejected (new).
- Token with neither `phone_number` nor `email` claim rejected.

## Frontend design

### Entry point

`Front-end/src/features/auth/pages/LoginPage.tsx`, register mode, `step ===
'enter-phone'` screen gets a second option alongside the existing phone-number
form: a **"Đăng ký bằng Google"** button. Clicking it calls the existing
`signInWithGoogle()` (`Front-end/src/lib/firebase.ts:50`, currently unwired)
immediately — no intermediate screen, matching the one-click nature of a
Google popup flow.

### State model

`RegisterStep` stays `'enter-phone' | 'enter-code' | 'enter-details'`; add an
`authMethod: 'phone' | 'google'` piece of state (default `'phone'`), set to
`'google'` right before jumping to `'enter-details'` on a successful Google
popup. The `enter-details` form:
- **Both methods**: password field, submit button, same validation.
- **Phone method (unchanged)**: name + optional email fields; phone already
  known from step 1.
- **Google method (new)**: name + email fields pre-filled from
  `user.displayName` / `user.email` (email read-only — it's now
  Firebase-verified, editing it would defeat the point); a new phone number
  field (required, same format validation as the phone-path's step 1).

### Error handling

`friendlyError()` gets Google-popup-specific cases added
(`auth/popup-closed-by-user`, `auth/cancelled-popup-request` → "Đã hủy đăng
nhập Google, thử lại." or similar) alongside the existing OTP error mappings.
Backend `409` (duplicate email) surfaces through the same `ApiError` path
already used for duplicate-phone today.

### What does NOT change

- `handleLogin` / the login form / `AuthContext` — untouched, per "Google is
  registration-only."
- The phone-OTP registration path's own steps and validation — untouched.
- No new routes; still all within `LoginPage.tsx`'s existing `mode ===
  'register'` branch.

## Risks / open edges

- Firebase popups can be blocked by browser popup blockers on some
  configurations — out of scope to solve generally; the existing
  `friendlyError()` pattern will surface whatever Firebase reports.
- If a user's Google account email is already registered as a *plain-email*
  field on a phone-OTP account (not Firebase-linked), this now correctly
  rejects as a duplicate rather than silently creating a second account —
  intentional per decision #4 above, may surprise a user who forgot they
  already had an account; acceptable per the owner's explicit choice.
