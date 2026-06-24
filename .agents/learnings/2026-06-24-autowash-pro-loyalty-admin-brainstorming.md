# Development Journal: AutoWash Pro Loyalty Engine & Admin Brainstorming

- **Date**: 2026-06-24
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: [2026-06-24-autowash-pro-design.md](file:///d:/demoSWP/demo1/docs/superpowers/specs/2026-06-24-autowash-pro-design.md)

## Summary of Changes
- Brainstormed and defined the **Loyalty Engine**: points earning rate (1000 VND paid = 1 point base), real-time accumulation formula with tier and campaign multipliers ($P = (V/1000) * K_h * K_{km}$).
- Aligned **Tier Progression Thresholds** to follow the rolling 12-month washes (visits) and spend values:
  - **Member**: Default (0 spend, 0 washes).
  - **Silver**: $\ge 5$ washes OR $\ge 2,000,000$ VND spend.
  - **Gold**: $\ge 15$ washes OR $\ge 6,000,000$ VND spend.
  - **Platinum**: $\ge 30$ washes OR $\ge 15,000,000$ VND spend.
- Updated **Registration Form** fields: Full Name, Password, Password Confirmation (re-password), Phone Number (OTP verified), and Gmail (optional). Included optional Vehicle Information (Plate manual or upload image, and Size).
- Structured **Booking Flow & Rules**:
  - Services are displayed as a pop-up window/modal (combos or individual packages).
  - Prominent "Sửa" (Edit) buttons next to each summary section in Step 6 (Confirmation). Clicking confirm generates the booking code and VietQR.
  - Booking **cannot be canceled by the customer** after submission.
  - Multi-booking restriction: Must cancel existing active request before placing a new one.
  - Included a 1-day advance reminder notification.
  - Enforced 100% manual bank transfer checkout.
- Added **New User Voucher Policy**: 50k voucher for bill > 300k, 100k voucher for bill > 500k. Added display of active promotions on customer UI.
- Outlined **Washing Counter (Check-in)**: Manual check-in button operations (LPR camera simulation removed).
- Detailed the **Admin Dashboard** requirements: Customer Management (with view modal, search/filter/sort, profile update), Booking Management (current date filter, status filter, infinite scroll using JS), Income statistics (grouped by Day/Month/Year), point log, and sorting.
- Added a general project rule to perform Stitch mockup demos and align with the user before starting frontend code development.

## Technical Decisions & Trade-offs
- **Washes/Spend Tier Thresholds**: Aligned with the user's detailed research document (`Phân Tích Dự Án AutoWash.md`) to use visits or VND spend in rolling 12 months rather than raw points, matching their business model logic.
- **Strict Cancellation Policy**: Enforced no-cancellation rule post-confirmation to match the real-world operational security constraints.
- **Pre-Confirmation Edit Buttons**: Implemented edit buttons on the summary panel in Step 6 so that the booking reference code and VietQR are generated *only* after final confirmation.
- **Non-Unique License Plates**: Allowed non-unique license plates globally so that shared family vehicles can be registered under separate customer accounts.

## Key Learnings & Gotchas
- **Gotcha**: When designing the confirmation step, the booking reference code should not be pre-generated. It must be generated post-submission to prevent orphan bookings in the database.
- **Rule Enforcement**: Always ensure Stitch demos are completed and verified before initiating any code modifications in the frontend.

## Next Steps
- Transition to creating the implementation plan (`writing-plans` skill) after the user reviews and approves this aligned specification.
