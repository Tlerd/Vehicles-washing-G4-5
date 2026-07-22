# Technical Specification: [FR-006] Loyalty Point Accumulation

## Purpose

The loyalty engine credits points only when a member booking reaches `COMPLETED`. Guest bookings never earn points.

## Rules

- Point calculation uses the completed booking’s price snapshot, tier multiplier, and applicable campaign multiplier under BR-002 and BR-003.
- Completion occurs through customer confirmation or the paid-only automatic confirmation job; staff does not complete bookings.
- The calculation is idempotent: a booking can create one loyalty credit only.
- Price snapshots, not current service prices, are the source for historic calculations and revenue consistency.

## Behaviour and Acceptance Criteria

1. Given a member confirms a completed booking, the system credits one calculated point transaction and updates the balance.
2. Given a guest completes a booking, no point transaction is created.
3. Given the automatic completion job runs after 15 minutes with `paid_amount >= total_amount`, it may credit points once.
4. Given a retry of the completion event, the existing point transaction is returned or preserved without duplicate credit.

## Source Rules

[Booking lifecycle](../refactor/01-LUONG-CHAY-MOI.md) and [BR-002, BR-003, BR-024, BR-026, and BR-031](../refactor/06-BUSINESS-RULES-V2.md).