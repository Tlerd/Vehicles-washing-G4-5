# Development Journal: AutoWash Pro Frontend Implementation

- **Date**: 2026-06-24
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: [2026-06-24-autowash-pro-design.md](file:///d:/demoSWP/demo1/docs/superpowers/specs/2026-06-24-autowash-pro-design.md)

## Summary of Changes
- Expanded [BookingContext.tsx](file:///d:/demoSWP/demo1/Front-end/src/context/BookingContext.tsx) to act as an offline mock database, managing tables for customers, vehicles, bookings, transaction logs, and promotions.
- Modified [App.tsx](file:///d:/demoSWP/demo1/Front-end/src/App.tsx) with a top navigation role-switching selector to swap views between Customer Portal, Washing Counter (LPR) Portal, and Admin Portal.
- Upgraded the booking flow to a 6-step Booking Wizard by adding [StepCarSize.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepCarSize.tsx) as Step 1.
- Redesigned and implemented [StepServices.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepServices.tsx) (combos detailed popup with kem/yellow background), [StepSchedule.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepSchedule.tsx) (sms/email reminder checkbox preference, dynamic scheduling window based on tier), and [StepPayment.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/booking/components/StepPayment.tsx) (summary cards with individual edit back-navigation buttons, post-confirmation VietQR and code generation, multi-booking restriction verification).
- Built [CustomerDashboard.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/dashboard/CustomerDashboard.tsx) (5 tabs: profile edit, vehicle CRUD with simulated LPR upload plate scanning, booking history locking, loyalty progress visualizer, rewards redeem shop, system promotions catalog).
- Created [WashingCounterPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/washing-counter/WashingCounterPage.tsx) (operational queues: approvals, expected check-ins, washing bays, with point credit checkout triggers).
- Created [AdminPage.tsx](file:///d:/demoSWP/demo1/Front-end/src/pages/admin/AdminPage.tsx) (customer directories with search/sort/filter, infinite scroll booking management list, revenue day/month/year breakdown metrics, and AI campaign builder publishing promotions directly to the customer database).

## Technical Decisions & Trade-offs
- **Decoupling/Offline Mock State**: All database tables and state mutations are fully simulated inside the expanded React `BookingContext.tsx`. This permits absolute offline front-end validation and customer review before linking to live endpoints.
- **Root Context Wrapper**: Wrapped the root of `App.tsx` with `<BookingProvider>` to make all dashboards and wizards share the exact same reactive mock state. This enables actions in the Washing Counter (e.g., Check-in or Checkout) or Admin Portal (e.g., publish new AI campaign promotion) to propagate instantly to the Customer Portal.

## Key Learnings & Gotchas
- **Gotcha**: The terminal `run_command` currently fails on the Windows sandbox with "opening NUL for ACL write: Access is denied". Developers should run `npm install` and verification scripts (`npm run build`, `npm run dev`) manually in their Windows terminal within the `Front-end` folder.
- **Gotcha**: Clicking stepper headers needs to be disabled for steps the user has not yet reached, but allowed for previous steps to review and edit. We implemented `handleStepClick` with a strict `stepNumber < state.currentStep` validation.

## Next Steps
- Verify the build by executing `npm run build` inside `Front-end`.
- Start the local dev server `npm run dev` to showcase the flow to stakeholders.
- Maintain and update log details in the project's global [AGENTS.md](file:///d:/demoSWP/demo1/.agents/AGENTS.md) journal.
