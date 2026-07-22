# Technical Specification: [FR-003] Vehicle CRUD Management

## Purpose

Members manage their garage vehicles. A selected vehicle supplies the booking size; guests enter vehicle information only for the current booking.

## Data and Rules

- A vehicle contains its owner, license plate, brand/model, `size`, notes, and default flag.
- Supported sizes are `hatchback`, `sedan`, `suv`, and `pickup`; the booking engine maps them to BR-001 multipliers.
- Customers may create, read, update, and delete only their own vehicles. Admin may read vehicles through authorized administration views.
- Staff vehicle-size correction occurs through the booking workflow under BR-020, records a reason in `audit_logs`, and updates the saved vehicle for a member when applicable.

## APIs

- `GET /api/v1/vehicles`
- `POST /api/v1/vehicles`
- `PUT /api/v1/vehicles/{id}`
- `DELETE /api/v1/vehicles/{id}`

## Acceptance Criteria

1. A member can manage only vehicles they own.
2. The wizard can select a saved vehicle or create one inline without losing wizard state.
3. A guest can proceed with temporary vehicle information but does not create a garage record.
4. An unauthorized vehicle update receives `403 Forbidden`.

## Source Rules

[Booking flow](../refactor/01-LUONG-CHAY-MOI.md) and [BR-001 and BR-020](../refactor/06-BUSINESS-RULES-V2.md).