# Implementation Backlog: AutoWash Pro v2

## 1. Foundation

- [ ] Create the three-layer design token system: `palette.css`, `semantic.css`, and `density.css`.
- [ ] Build shared UI components: Button, Card, Input, Badge, Chip, Skeleton, EmptyState, Modal/Sheet, Toast, Stepper, PriceTag, and Countdown.
- [ ] Use B Fresh density for customer experiences and C Utility density for admin; do not implement Dark Mode/Glassmorphism as the default design.

## 2. Authentication and Garage

- [ ] Implement Firebase Phone OTP and Google Sign-In, with account linking and E.164 normalization.
- [ ] Require Google users to add a phone number before their first booking.
- [ ] Implement customer vehicle CRUD and inline vehicle creation in the booking flow.

## 3. Catalog and Booking

- [ ] Implement admin-managed service/combo catalog and `combo_includes` duplicate warnings.
- [ ] Build the icon-grid picker, service modal, inline follow-up prompt, cart bar, and review price breakdown.
- [ ] Build the 15-minute weekly grid (8 columns × 44 rows) with compatible-bay availability and mobile two-axis scrolling.
- [ ] Implement bay allocation, 15-minute soft hold, unique bay-slot protection, idempotency, and hold-expiry cleanup.
- [ ] Implement the six-step booking wizard and final VNPAY deposit checkout.

## 4. Lifecycle and Loyalty

- [ ] Implement VNPAY create, return, and IPN; only IPN confirms booking status.
- [ ] Implement customer check-in, staff start/finish, customer confirmation/dispute, paid-only auto-confirm, and no-show handling.
- [ ] Implement point credit, tier evaluation, voucher tier validation, feedback, and guest restrictions.

## 5. Administration and Reporting

- [ ] Implement admin CRUD for services, combos, staff, guests, and tier configuration.
- [ ] Implement audited admin rescheduling and status override with mandatory customer notification.
- [ ] Implement booking management, revenue reports from price snapshots, audit logs, and required dashboard corrections.

## Definition of Done

- [ ] Loading, empty, error, and success states are present.
- [ ] Components remain under 300 lines and TypeScript uses no `any`.
- [ ] Customer/mobile layouts are tested at 375px and desktop at 1440px.
- [ ] Side-effect actions have disabled state and an Idempotency-Key where applicable.
- [ ] New backend endpoints have Swagger operations and business changes create audit logs where required.

## Source Plan

[PLAN-V2](../refactor/PLAN-V2-LAM-LAI-FE.md), [UI/UX specification](../refactor/04-UI-UX-SPEC.md), and [the end-to-end flow](../refactor/01-LUONG-CHAY-MOI.md).