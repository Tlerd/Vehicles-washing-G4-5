# AI Log — [FR-001] Customer Registration & Identity Verification

- **Date (local):** 2026-07-21
- **Developer / Author:** Đặng Minh Bình An
- **Milestone:** m1
- **Requirement ID:** FR-001
- **Status:** Completed & Verified
- **Scope:** Customer registration with Firebase Phone OTP and Google Sign-In, identity linking, E.164 phone formatting, and backend auth integration.

---

## 1. Task Description

Implement and verify end-to-end customer registration flow for **FR-001**:
- Enable customer registration using **Firebase Phone OTP** and **Google Sign-In**.
- Enforce strict identity linking: matching email/phone links to a single customer record rather than creating duplicate accounts.
- Convert Vietnamese local phone numbers (e.g., `0901234567`) to **E.164** format (`+84901234567`) prior to sending to Firebase.
- Handle required missing information (e.g., forcing Google users without a phone number to input phone number prior to their first booking).

---

## 2. Implementation & Technical Details

### Frontend Components & Workflow
- **Registration Form:** Integrated Firebase Web SDK v11 for Phone OTP (`RecaptchaVerifier`, `signInWithPhoneNumber`) and Google OAuth popup (`GoogleAuthProvider`).
- **Input Validation & E.164 Parsing:** Utilized Zod schema validation to automatically normalize Vietnamese phone inputs into E.164 standard (`+84...`).
- **OTP Resend Timer:** Added countdown timer UI state for SMS OTP resend throttling to prevent spamming.
- **State Management:** Stored temporary verified Firebase ID token in auth state before payload submission to backend.

### Backend Integration & Database Rules
- **API Endpoint:** `POST /api/v1/auth/register`
- **Token Verification:** Backend validates Firebase ID token via Firebase Admin SDK, extracts `uid`, `phone_number`, and `email`.
- **Database Uniqueness Constraints:**
  - `UNIQUE(phone) WHERE phone IS NOT NULL`
  - `UNIQUE(email) WHERE email IS NOT NULL`
- **Account Linking Logic:** If an account already exists with the given verified email or phone, the new provider credential is bound to the existing `Customer` entity.

---

## 3. Business Rules Compliance

- **BR-015:** One account per individual. Duplicate phone or email registrations are rejected or linked gracefully.
- **BR-034:** Firebase ID token verification required before granting application JWT access token.

---

## 4. Verification & Testing Evidence

- **Type Check:** `npx tsc --noEmit` passed with 0 errors.
- **Frontend Build:** `npm run build` executed successfully.
- **Backend Tests:** `mvn test` passed all auth-related unit tests.
- **Browser Live Verification:** Tested Phone OTP flow and Google popup modal on Vite dev server (`http://localhost:5173`). Verified API response returns valid JWT access token and user profile object.

---

## 5. Security & Edge Cases Handled

- **IDOR / Privilege Isolation:** Enforced strict backend validation ensuring `CUSTOMER` registration cannot set `ADMIN` or `STAFF` roles.
- **Malformed Phone Input:** Invalid phone formats fail client validation before calling Firebase APIs.
- **Expired Tokens:** Submitting an expired or tampered Firebase token triggers `400 Bad Request` / `401 Unauthorized` with clear client notification.
