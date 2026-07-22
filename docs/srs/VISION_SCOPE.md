# Vision and Scope: AutoWash Pro v2

## Vision

AutoWash Pro provides appointment-based car care with reliable self-service booking, deposit verification, operational bay management, and loyalty rewards.

## In Scope

- Firebase Phone OTP or Google Sign-In with account linking.
- Guest and member booking through the six-step flow: branch, service, date/time, vehicle, review, and confirmation.
- Seven service categories, combo/single-service selection, vehicle-size pricing, and compatible bay capacity.
- 15-minute booking grid, soft hold, no-show handling, change requests, vehicle-size correction, and VNPAY deposits.
- Customer check-in and completion confirmation; staff start/finish operations; paid-only automatic confirmation.
- Loyalty points, configurable tiers, voucher eligibility, feedback, and guest-to-member conversion.
- Admin management of services, combos, staff, guests, customers, rescheduling, revenue, and audit logs.

## Constraints

- The service is for cars only.
- Booking confirmation depends on a valid VNPAY IPN; the browser return route is not a payment authority.
- Guests do not earn points, use vouchers, save vehicles, or submit feedback.
- Customers request schedule changes instead of directly cancelling; operational changes require the documented audit and notification rules.
- Customer UI uses B Fresh density and admin UI uses C Utility density; Light Mode is the default.

## Success Criteria

- A customer can complete the end-to-end booking, deposit, check-in, service, confirmation, and loyalty flow without staff approving the booking.
- Concurrent bookings cannot reserve the same bay slot.
- Revenue remains correct after service price changes because it uses booking snapshots.

## Source Rules

[Decision log](../refactor/00-QUYET-DINH-REFACTOR.md), [end-to-end flow](../refactor/01-LUONG-CHAY-MOI.md), [business rules](../refactor/06-BUSINESS-RULES-V2.md), and [UI/UX specification](../refactor/04-UI-UX-SPEC.md).