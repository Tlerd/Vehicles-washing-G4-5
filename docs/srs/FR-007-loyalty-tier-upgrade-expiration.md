# Technical Specification: [FR-007] Loyalty Tier Upgrade and Expiration

## Purpose

Tier evaluation uses completed, price-snapshotted member bookings under the existing rolling-12-month rules. Tier configuration is data-driven.

## Rules

- Only `COMPLETED` member bookings contribute to tier calculation; `PENDING_DEPOSIT`, `CONFIRMED`, and operational states do not.
- Tier upgrades are evaluated immediately after a valid loyalty credit; periodic review handles downgrade and point expiration as defined in BR-005 through BR-008.
- Gold and Platinum deposit waivers are tier configuration consumed by BR-017.

## Acceptance Criteria

1. A qualifying completed booking immediately recalculates the member tier.
2. A pending-deposit or incomplete booking does not affect tier qualification.
3. A scheduled review applies the rolling-12-month and point-expiration rules without changing historic booking snapshots.

## Source Rules

[BR-004 through BR-008 and BR-017](../refactor/06-BUSINESS-RULES-V2.md).