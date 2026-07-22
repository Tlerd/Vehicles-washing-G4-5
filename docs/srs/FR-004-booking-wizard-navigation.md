# Technical Specification: [FR-004] Six-Step Booking Wizard

## Purpose

The wizard retains selections in client state until final confirmation, then creates one booking. The authoritative order is:

1. Branch
2. Service
3. Date & time
4. Vehicle
5. Review
6. Confirmation and deposit payment

## Step Rules

- **Branch:** show branch name, address, area tag, available-slot badge, and disabled state with `booking_notice` when booking is unavailable.
- **Service:** use separate COMBO and SINGLE icon grids. Selecting an icon opens a modal; closing it shows the inline “Chọn thêm dịch vụ khác?” prompt. A combo warns when a selected single service is already included.
- **Date & time:** show a sticky-header weekly grid with 8 columns × 44 rows, 15-minute intervals, and 07:00–18:00 operating hours. A slot is unavailable when it is before the branch minimum advance time, lacks consecutive capacity, has no compatible bay, or is soft-held by another booking.
- **Vehicle:** members select a garage vehicle or add one inline. Guests enter vehicle information and size manually. A member vehicle supplies the size.
- **Review:** calculate the final price per item using the selected vehicle size, show voucher eligibility for members only, and show total, deposit, and counter balance separately.
- **Confirmation:** guests verify their phone by OTP, then the system creates `PENDING_DEPOSIT` and starts VNPAY payment.

## Pricing and Capacity

- Display “from” pricing at service selection using Sedan (`1.0`) pricing; calculate the final price only at review.
- Use the size multipliers and `is_size_dependent` rules from BR-001/BR-001b.
- Use 15-minute slots, `duration_min + buffer_min`, compatible bays, and soft holds as defined by BR-022, BR-029, and BR-030.
- Guests may book but cannot earn points, use vouchers, provide feedback, or save vehicles.

## APIs

- `GET /api/v1/branches`
- `GET /api/v1/branches/{id}/slots?date=&duration=`
- `POST /api/v1/bookings` at Step 6 only

The booking-create payload, response, and error behavior are defined in [the v2 flow](../refactor/01-LUONG-CHAY-MOI.md).

## Acceptance Criteria

1. The wizard preserves selections when the customer edits an earlier step.
2. The service grid shows combo-inclusion warnings without blocking valid additional selections.
3. The date grid renders 15-minute availability and prevents invalid starts.
4. The review price uses the selected vehicle size and separates deposit from counter balance.
5. A guest may proceed only after phone OTP verification and receives no loyalty or voucher benefit.

## Source Rules

[End-to-end flow](../refactor/01-LUONG-CHAY-MOI.md), [catalog](../refactor/02-CATALOG-DICH-VU.md), [UI/UX spec](../refactor/04-UI-UX-SPEC.md), and [business rules](../refactor/06-BUSINESS-RULES-V2.md).