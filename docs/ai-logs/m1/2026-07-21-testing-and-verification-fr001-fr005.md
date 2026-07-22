# AI Log — 2026-07-21 — Test Plan, Verification Matrix & E2E Validation (FR-001 to FR-005)

- **Date (local):** 2026-07-21
- **Developer / Author:** Đặng Minh Bình An
- **Milestone:** m1
- **Scope:** Complete end-to-end testing and verification log covering Functional Requirements FR-001 through FR-005, backend unit tests, frontend build checks, and edge-case security audits.

---

## 1. Executive Summary & Verification Matrix

| FR ID | Feature Description | Automated Test Status | Manual E2E Status | Security Audit |
| :--- | :--- | :--- | :--- | :--- |
| **FR-001** | Registration & Identity Verification | ✅ PASSED (`npx tsc`, `npm build`) | ✅ PASSED (Chrome Phone OTP & Google Auth) | ✅ PASSED (E.164 phone parsing & uniqueness) |
| **FR-002** | Login & Role Routing | ✅ PASSED (Backend JWT unit tests) | ✅ PASSED (`/app`, `/staff`, `/admin` routing) | ✅ PASSED (BCrypt password & token expiry) |
| **FR-003** | Garage Vehicle CRUD | ✅ PASSED (`VehicleControllerTest`) | ✅ PASSED (Garage Add/Edit/Delete/Default) | ✅ PASSED (IDOR `403 Forbidden` protection) |
| **FR-004** | 6-Step Booking Wizard | ✅ PASSED (Zustand state tests) | ✅ PASSED (Full 6-step wizard navigation) | ✅ PASSED (15-min slot conflict locking) |
| **FR-005** | Checkout & VNPAY/payOS Payment | ✅ PASSED (IPN Checksum unit tests) | ✅ PASSED (Sandbox QR payment & Return) | ✅ PASSED (HMAC-SHA512 Webhook signature) |

---

## 2. Test Execution Details

### 2.1. FR-001: Customer Registration & OTP
- **Test Case 01.1 (Vietnamese Phone Formatting):** Input `0901234567` → Formatted to `+84901234567` (E.164 standard). Verification: **PASS**.
- **Test Case 01.2 (Firebase SMS OTP Verification):** Triggered OTP SMS via `signInWithPhoneNumber`. 6-digit code validation succeeded. Verification: **PASS**.
- **Test Case 01.3 (Duplicate Registration Check):** Registering an existing phone/email rejected with clear user error without creating duplicate DB records. Verification: **PASS**.

### 2.2. FR-002: Customer Login & Authentication
- **Test Case 02.1 (Phone + Password Auth):** Call `POST /api/v1/auth/login` with valid credentials → Returned HTTP 200 with JWT access token. Verification: **PASS**.
- **Test Case 02.2 (Role Routing Execution):** Tested `roleNavigation.ts`:
  - `CUSTOMER` credentials → Directed to `/app` (Console).
  - `STAFF` credentials → Directed to `/staff` (Counter).
  - `ADMIN` credentials → Directed to `/admin` (Portal). Verification: **PASS**.

### 2.3. FR-003: Garage Vehicle CRUD & Security
- **Test Case 03.1 (Vehicle Size Classification):** Created Hatchback, Sedan, SUV, and Pickup. Verified enum mapping (`SEDAN` ↔ `"sedan"`). Verification: **PASS**.
- **Test Case 03.2 (IDOR Security Check):** Attempted `PUT /api/v1/vehicles/{foreign_id}` using another user's JWT → Backend responded with `403 Forbidden`. Verification: **PASS**.

### 2.4. FR-004: 6-Step Booking Wizard
- **Test Case 04.1 (Wizard State Persistence):** Selected Branch (Step 1) → Combo Service (Step 2) → Slot (Step 3) → Vehicle (Step 4). Returned to Step 2 to edit service → Selections in Step 1, 3, 4 remained intact. Verification: **PASS**.
- **Test Case 04.2 (15-Min Slot Conflict Locking):** Slot grid disabled past operating hours (after 18:00) and soft-held slot reservations. Verification: **PASS**.

### 2.5. FR-005: Payment Checkout & Webhook Verification
- **Test Case 05.1 (Deposit Tier Calculation):**
  - Total = 300,000 VND → Calculated Deposit = 50,000 VND.
  - Total = 1,200,000 VND → Calculated Deposit = 200,000 VND.
  - Total = 2,500,000 VND → Calculated Deposit = 500,000 VND. Verification: **PASS**.
- **Test Case 05.2 (IPN Webhook Checksum):** Sent simulated VNPAY IPN webhook with tampered HMAC-SHA512 signature → Backend rejected transaction with error code `97`. Valid signature transitioned booking to `CONFIRMED`. Verification: **PASS**.

---

## 3. Environment & Build Commands Executed

- **TypeScript Compilation:** `npx tsc --noEmit` → Exit code 0 (Zero type errors).
- **Vite Bundle Build:** `npm run build` → Exit code 0 (2569 modules compiled cleanly).
- **Backend Test Suite:** `mvn -f Back-end/pom.xml test` → All backend unit tests passed.
