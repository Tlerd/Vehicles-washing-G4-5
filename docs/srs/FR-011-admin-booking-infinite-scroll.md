# Technical Specification: [FR-011] Admin Booking Management and Rescheduling

## Purpose

Administrators view booking history with paginated/infinite loading and may reschedule any booking under the v2 audit and notification rules.

## Behaviour

- The list supports date, status, branch, and customer filters plus stable sorting and incremental loading.
- The displayed status set uses the v2 lifecycle, including `PENDING_DEPOSIT`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `AWAITING_CONFIRM`, `DISPUTED`, `NO_SHOW`, `CHANGE_REQUESTED`, `COMPLETED`, `EXPIRED`, and `CANCELLED` where applicable.
- Rescheduling requires an available compatible bay/slot, a mandatory reason, a customer notification, and an `audit_logs` entry.
- The listing must not grant staff-only or customer-only state transitions to the admin UI except the documented admin override workflow.

## APIs

- `GET /api/v1/admin/bookings`
- `PATCH /api/v1/admin/bookings/{id}/reschedule`
- `PATCH /api/v1/admin/bookings/{id}/override`
- `GET /api/v1/admin/reports/reschedule-audit`

## Acceptance Criteria

1. Loading successive pages appends records without duplicating previously loaded bookings.
2. Applying a filter resets pagination and returns only matching v2 statuses.
3. A reschedule request without a reason, valid capacity, audit entry, or notification is rejected.
4. A non-admin request receives `403 Forbidden`.

## Source Rules

[Admin specification](../refactor/07-ADMIN-SPEC.md) and [BR-033](../refactor/06-BUSINESS-RULES-V2.md).