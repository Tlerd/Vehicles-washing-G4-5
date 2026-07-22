# Technical Specification: [FR-010] Admin Customer, Staff, and Guest Directory

## Purpose

Administrators manage customer records and the associated staff and guest directories. The module supports the wider v2 admin scope without giving non-admin users access.

## Rules

- Customer records remain searchable, filterable, sortable, and viewable with profile, vehicles, booking history, loyalty data, and audit history.
- Administrators may create and manage staff; the system enforces the single-admin restriction described in the refactor plan.
- Guests are managed separately from users. Guest phone numbers are not edited directly; registration merges a guest into a user according to BR-032.
- Administrative changes that affect a booking follow the rescheduling/override rules and must be audited.

## APIs

- `GET /api/v1/admin/customers`
- `GET /api/v1/admin/staff`
- `POST /api/v1/admin/staff`
- `PATCH /api/v1/admin/staff/{id}`
- `PATCH /api/v1/admin/staff/{id}/active`
- `GET /api/v1/admin/guests`
- `PATCH /api/v1/admin/guests/{id}`
- `POST /api/v1/admin/guests/{id}/invite`

All endpoints require the admin role and reject other roles with `403 Forbidden`.

## Acceptance Criteria

1. An admin can find a customer by profile data or vehicle plate and view the related history.
2. An admin can manage staff and guests only through admin-authorized endpoints.
3. A non-admin request receives `403 Forbidden`.
4. Guest registration linkage preserves one identity rather than duplicate guest/user records.

## Source Rules

[Admin specification](../refactor/07-ADMIN-SPEC.md) and [BR-032, BR-033, and BR-034](../refactor/06-BUSINESS-RULES-V2.md).