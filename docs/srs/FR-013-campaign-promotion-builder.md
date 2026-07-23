# Technical Specification: [FR-013] Campaign and Point-Multiplier Promotion Builder

## Purpose

Administrators configure point-multiplier campaigns used by the loyalty engine. Campaign administration remains distinct from booking-state administration.

## Rules

- Only admins create, edit, activate, or deactivate campaigns.
- A campaign specifies its goal, multiplier, target tier, active period, and visibility state.
- A campaign multiplier participates in BR-003 only for a qualifying completed member booking.
- Campaign changes are auditable administration actions. Booking rescheduling notifications are governed separately by BR-033.

## API

`POST /api/v1/promotions` creates a campaign. The remaining existing campaign operations use the same `/api/v1/promotions` resource family and require admin authorization.

## Acceptance Criteria

1. An admin can create an active campaign with a valid period and multiplier.
2. A campaign outside its active period does not affect point calculation.
3. A campaign targeted to another tier does not affect the current member.
4. A non-admin campaign write request receives `403 Forbidden`.

## Source Rules

[BR-003 and BR-025](../refactor/06-BUSINESS-RULES-V2.md).
