# Technical Specification: [FR-012] Admin Revenue Statistics and Audit Logs

## Purpose

The admin dashboard reports reliable revenue from completed booking price snapshots and exposes audit trails for controlled administrative actions.

## Rules

- Revenue includes completed bookings only and reads the price snapshot stored with booking items; it never recalculates historic totals from current service prices.
- Reporting converts stored UTC timestamps to the configured local reporting timezone before grouping by day, month, or year.
- Audit logs cover the actions mandated by BR-025, including state overrides, vehicle-size corrections, staff management, point adjustments, and rescheduling.

## APIs

- `GET /api/v1/admin/reports/revenue?from=&to=&groupBy=day|month|year`
- `GET /api/v1/admin/audit-logs?entityType=&actorId=&from=&to=`
- `GET /api/v1/admin/reports/bay-utilization`
- `GET /api/v1/admin/reports/reschedule-audit`

## Acceptance Criteria

1. Completed bookings aggregate by the requested local reporting period.
2. Pending, held, incomplete, cancelled, expired, and no-show bookings do not contribute to revenue.
3. Changing a service price does not alter historical revenue.
4. An audit-log query exposes actor, action, entity, reason, and timestamp only to admins.

## Source Rules

[Admin specification](../refactor/07-ADMIN-SPEC.md) and [BR-025 through BR-027](../refactor/06-BUSINESS-RULES-V2.md).