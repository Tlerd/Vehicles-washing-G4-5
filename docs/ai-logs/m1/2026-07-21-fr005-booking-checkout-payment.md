# AI Log — [FR-005] Booking Checkout & Payment Integration

- **Date (local):** 2026-07-21
- **Developer / Author:** Đặng Minh Bình An
- **Milestone:** m1
- **Requirement ID:** FR-005
- **Status:** Completed & Verified
- **Scope:** Booking checkout confirmation, deposit tier calculation, online payment gateway (VNPAY / payOS) payment URL generation, hold expiration, and IPN callback verification.

---

## 1. Task Description

Implement and verify checkout and payment integration for **FR-005**:
- Finalize booking submission, creating booking record with status `PENDING_DEPOSIT`.
- Hold 15-minute slot reservation during deposit checkout.
- Calculate tiered deposit amount based on total booking value:
  - Total < 500,000 VND → Deposit = 50,000 VND
  - Total 500,000 – 2,000,000 VND → Deposit = 200,000 VND
  - Total > 2,000,000 VND → Deposit = 500,000 VND
- Generate payment gateway checkout URL (VNPAY / payOS) and redirect customer.
- Handle IPN server-to-server webhook to transition booking status to `CONFIRMED`.

---

## 2. Implementation & Technical Details

### Frontend Components & Workflow
- **Checkout Step:** `Step6Confirmation.tsx` presenting summary breakdown (Services, Time, Vehicle, Deposit required, Counter balance).
- **Payment Redirect:** Triggers gateway URL creation call and redirects customer browser to payment page.
- **Payment Result Handling:** `/booking/return` page to display transaction status (Success / Failed / Cancelled).

### Backend Integration & Payment Gateway
- **APIs:**
  - `POST /api/v1/bookings` — create booking in `PENDING_DEPOSIT` status and reserve bay slot for 15 minutes.
  - `POST /api/v1/payments/vnpay/create` (or payOS equivalent) — generate signed payment URL.
  - `POST /api/v1/payments/vnpay/ipn` — process checksum-verified IPN notification.
  - `GET /api/v1/payments/vnpay/return` — client return page handler.
- **Hold Expiration Job:** Background task cleans up expired `HOLD` reservations after 15 minutes if unpaid, marking booking `EXPIRED`.

---

## 3. Business Rules Compliance

- **BR-017 / BR-026:** Tiered deposit rule enforcement (`MIN(tiered deposit, total)`).
- **Security Checksum:** HMAC-SHA512 signature validation on IPN callbacks to prevent payment forgery. Status transition to `CONFIRMED` occurs ONLY on valid IPN.

---

## 4. Verification & Testing Evidence

- **Type Check:** `npx tsc --noEmit` passed.
- **Build Status:** `npm run build` executed successfully.
- **Backend Tests:** Unit tests verified deposit calculation logic and IPN checksum verification algorithm.
- **Payment Gateway Sandbox:** Tested transaction flow in payment gateway sandbox environment. Verified IPN handler transitions booking to `CONFIRMED`.

---

## 5. Security & Edge Cases Handled

- **Signature Forgery Prevention:** IPN handler rejects callbacks with invalid or missing secret signatures.
- **Double Payment Prevention:** Concurrent IPN processing uses database transaction locking to prevent duplicate confirmation.
- **Hold Timeout:** Expired deposit attempts return `410 Gone` and prompt customer to re-book.
