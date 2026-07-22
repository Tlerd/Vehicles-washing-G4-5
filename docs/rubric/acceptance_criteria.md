# Acceptance Criteria: AutoWash Pro v2

## Authentication

1. Given a customer selects Phone OTP or Google Sign-In, when Firebase verifies the selected provider, then registration/login resolves to one linked account.
2. Given a Google account without a phone number, when the customer attempts the first booking, then the system requires a phone number before continuing.

## Booking and Payment

1. Given valid branch, service, time, vehicle, and review selections, when the customer confirms at Step 6, then the system creates `PENDING_DEPOSIT`, holds compatible slots for 15 minutes, and provides VNPAY payment.
2. Given a valid VNPAY IPN, when the backend verifies signature and amount, then the booking changes to `CONFIRMED`; a browser return URL alone cannot change it.
3. Given two users reserve the same bay slot concurrently, when both submit payment, then one succeeds and the other receives `409 Conflict` with alternatives.
4. Given a reservation passes its expiry, when the cleanup job runs, then it changes to `EXPIRED` and releases every held slot.

## Counter and Completion

1. Given a confirmed booking, when the customer checks in, then it becomes `CHECKED_IN`.
2. Given a checked-in booking, when staff starts and finishes the service, then it becomes `IN_PROGRESS` and then `AWAITING_CONFIRM` with the actual paid amount recorded.
3. Given an awaiting-confirmation booking, when the customer confirms or the paid-only 15-minute job qualifies it, then it becomes `COMPLETED` and loyalty is processed once.
4. Given staff calls the completion endpoint, then the server returns `403 Forbidden`.

## Loyalty, Voucher, and Admin

1. Given a member booking becomes completed, then points and tier evaluation use its price snapshot; a guest booking earns no points.
2. Given a voucher does not satisfy the member tier, then booking confirmation rejects it before hold/payment.
3. Given an admin reschedules a booking, then capacity is validated, a reason is recorded in `audit_logs`, and the customer is notified.
4. Given a completed booking is reported, then revenue uses local reporting time and price snapshots; all non-completed states are excluded.

## Source Rules

[End-to-end flow](../refactor/01-LUONG-CHAY-MOI.md), [contact handling](../refactor/03-NGHIEP-VU-CONTACT.md), [business rules](../refactor/06-BUSINESS-RULES-V2.md), and [admin spec](../refactor/07-ADMIN-SPEC.md).