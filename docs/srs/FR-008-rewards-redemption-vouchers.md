# Technical Specification: [FR-008] Voucher Redemption and Lifecycle

## Purpose

Members redeem points for vouchers and may apply only vouchers valid for their tier. Guests cannot receive, redeem, or apply vouchers.

## Rules

- BR-009 and BR-010 govern redemption value and new-member promotions.
- A valid voucher is locked only when a booking is created at final confirmation.
- A locked voucher becomes `USED` when the booking reaches `COMPLETED`.
- Expired holds, rejected/withdrawn change requests, and permitted cancellation outcomes restore voucher availability according to BR-011 and the contact-handling rules.
- Voucher eligibility is revalidated at booking creation and includes the configured minimum tier.

## API and Acceptance Criteria

- `POST /api/v1/rewards/redeem` is member-only.
- A member with sufficient points receives an active voucher.
- A guest receives an authorization/eligibility denial for voucher operations.
- A voucher below the customer’s tier requirement is rejected before slot hold and payment.
- A completed booking consumes its locked voucher exactly once.

## Source Rules

[Contact handling](../refactor/03-NGHIEP-VU-CONTACT.md) and [BR-009 through BR-011 and BR-016](../refactor/06-BUSINESS-RULES-V2.md).