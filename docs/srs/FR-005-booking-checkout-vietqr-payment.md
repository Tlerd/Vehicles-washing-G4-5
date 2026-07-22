# Technical Specification: [FR-005] Booking Checkout & VNPAY Deposit Payment

## Purpose

The final wizard step creates a booking with a temporary reservation and collects the required deposit through VNPAY. Manual VietQR transfer is not part of this flow.

## Booking and Payment Lifecycle

1. At final confirmation, validate the customer/guest, vehicle, items, voucher eligibility, final price, slot capacity, and active-booking rule.
2. In one transaction, allocate a compatible bay and create 15-minute `HOLD` slot reservations that expire after 15 minutes.
3. Create the booking as `PENDING_DEPOSIT` and provide the VNPAY payment URL.
4. Only a valid VNPAY IPN verifies the amount/signature and transitions the booking to `CONFIRMED`; the browser return URL never changes status.
5. Expired holds transition the booking to `EXPIRED` and release slots.

## Business Rules

- Active booking means one of `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, or `AWAITING_CONFIRM`. `PENDING_DEPOSIT` is not active.
- The deposit is `MIN(tiered deposit, total)`: 50,000 VND below 500,000 VND; 200,000 VND from 500,000–2,000,000 VND; 500,000 VND above 2,000,000 VND.
- Gold and Platinum may be deposit-waived. A customer with three or more no-shows requires full prepayment.
- Vouchers are member-only and must satisfy their tier rule before booking creation.
- Customers cannot self-cancel; they may submit a schedule-change request after confirmation.

## APIs

- `POST /api/v1/bookings`
- `POST /api/v1/payments/vnpay/create`
- `POST /api/v1/payments/vnpay/ipn`
- `GET /api/v1/payments/vnpay/return`
- `GET /api/v1/bookings/{ref}` for lookup; guests use reference plus phone validation.

The authoritative request, `201 Created` response, and error cases are in [the v2 flow](../refactor/01-LUONG-CHAY-MOI.md).

## Acceptance Criteria

1. A valid final confirmation creates `PENDING_DEPOSIT`, holds the required slots for 15 minutes, and displays the VNPAY payment route.
2. A valid IPN changes the booking to `CONFIRMED`; a browser return alone does not.
3. A simultaneous conflicting reservation produces `409 Conflict` for one request and does not double-book a bay slot.
4. An expired deposit hold releases all held slots and returns `410 Gone` for later payment attempts.
5. A customer with an active booking receives `409 Conflict`; a prior `PENDING_DEPOSIT` alone does not block a new booking.

## Source Rules

[End-to-end flow](../refactor/01-LUONG-CHAY-MOI.md) and [BR-012, BR-014, BR-017, BR-021, and BR-030](../refactor/06-BUSINESS-RULES-V2.md).