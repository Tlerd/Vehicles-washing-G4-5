# Technical Specification: [FR-009] Washing Counter Queue Operations

## Purpose

The counter supports operational work after customer check-in. It does not approve/reject bookings and staff never completes a booking.

## State Ownership

| Transition | Owner |
| --- | --- |
| `PENDING_DEPOSIT → CONFIRMED` | System after valid VNPAY IPN |
| `CONFIRMED → CHECKED_IN` | Customer or guest via lookup code; staff may assist with audit logging |
| `CHECKED_IN → IN_PROGRESS` | Staff |
| `IN_PROGRESS → AWAITING_CONFIRM` | Staff, after entering actual paid amount |
| `AWAITING_CONFIRM → COMPLETED` | Customer, or paid-only system job after 15 minutes |
| `AWAITING_CONFIRM → DISPUTED` | Customer |

## Counter Behaviour

- Display confirmed, checked-in, in-progress, awaiting-confirmation, and disputed work with bay allocation and vehicle details.
- Staff starts work only after check-in and finishes work by recording the actual amount received.
- Staff cannot call the customer confirmation endpoint; the server returns `403 Forbidden`.
- Staff can correct vehicle size at the counter only under BR-020, with a reason recorded in `audit_logs`.

## APIs

- `POST /api/v1/bookings/{id}/start`
- `POST /api/v1/bookings/{id}/finish`
- `PATCH /api/v1/bookings/{id}/vehicle-size`

Customer-owned endpoints and the full lifecycle are defined in [the v2 flow](../refactor/01-LUONG-CHAY-MOI.md).

## Acceptance Criteria

1. A checked-in booking can be started by staff and is assigned to an eligible bay.
2. Staff finishing work creates `AWAITING_CONFIRM` and records the actual paid amount without completing the booking.
3. A staff request to confirm completion is rejected with `403 Forbidden`.
4. A customer confirmation credits loyalty and consumes a locked voucher once.

## Source Rules

[End-to-end flow](../refactor/01-LUONG-CHAY-MOI.md), [contact handling](../refactor/03-NGHIEP-VU-CONTACT.md), and [BR-020, BR-024, and BR-031](../refactor/06-BUSINESS-RULES-V2.md).