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

---

# Development Journal: AutoWash Pro Requirements Document Generation

- **Date**: 2026-06-26
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: [results](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results)

## Summary of Changes
- Generated 6 core project requirement documents in `docs/superpowers/results`:
  - [vision_scope.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/vision_scope.md) - Vision & Scope.
  - [business_rules.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/business_rules.md) - Core loyalty formulas and business constraints.
  - [user_stories.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/user_stories.md) - Agile user stories for Customer, Guest, Staff, and Admin roles.
  - [acceptance_criteria.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/acceptance_criteria.md) - Scenario-based verification checks for key flows.
  - [tasks.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/tasks.md) - Comprehensive implementation task backlog.
  - [functional_requirements.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/functional_requirements.md) - Table index linking to 13 separate requirements issues files.
- Created 13 separate requirement files representing individual GitHub Issues templates containing Front-end, Back-end tasks and Acceptance Criteria:
  - [FR-001-customer-registration-otp.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/FR-001-customer-registration-otp.md) to [FR-013-ai-campaign-promotion-builder.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/FR-013-ai-campaign-promotion-builder.md).

---

# Development Journal: AutoWash Pro Task Assignment Revision for AI Module

- **Date**: 2026-06-26
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: [2026-06-26-autowash-pro-stitch-design-plan.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/plans/2026-06-26-autowash-pro-stitch-design-plan.md)

## Summary of Changes
- Adjusted the pair programming assignment for **FR-013: AI Campaign Promotion Builder (Admin)**.
- Replaced the FE pairing (**Phong & An**) and BE team with **Anh** taking full ownership as the Lead Developer for both the Front-end and Back-end parts of the AI campaign builder feature.
- To maintain the pair programming rule ("No single-developer tasks"), **An** was assigned to support/review the Front-end of FR-013, and **Phat** was assigned to support/review the Back-end of FR-013.
- Synced the changes across the workspace plan, the system implementation plan, and the task list tracker.

## Technical Decisions & Trade-offs
- **Planner direct coding**: Anh (Planner/Reviewer) will directly implement and take charge of the AI component integration, keeping other developers focused on core booking, customer directory, and payment functions.
- **Support pairing preserved**: Retained peer review support (An for FE, Phat for BE) to ensure code quality and avoid isolated changes, consistent with project rules.

---

# Development Journal: AutoWash Pro GitHub Issues & Project Mapping Setup

- **Date**: 2026-06-26
- **Author**: Agent (Antigravity) - Duc Anh (Planner / Reviewer)
- **Story/Feature Reference**: [github-issue-uploader.js](file:///D:/demoSWP/Vehicles-washing-G4-5/github-issue-uploader.js)

## Summary of Changes
- Created a standalone Node.js helper script [github-issue-uploader.js](file:///D:/demoSWP/Vehicles-washing-G4-5/github-issue-uploader.js) that automates:
  - Fetching the Project Node ID for GitHub Project #5.
  - Parsing the pair programming assignment plans for all 13 Functional Requirements from the design plan.
  - Creating all 13 GitHub Issues on the repository.
  - Mapping the newly created issues into the Project board.
- The script uses native `fetch` (compatible with Node.js v18+) for GraphQL and REST API requests, allowing the developer to run it locally without additional dependencies.

## Technical Decisions & Trade-offs
- **Platform Limitations Workaround**: Since both `run_command` (Access denied to NUL device) and browser subagent (CDP/127.0.0.1 resolution) are currently limited by environment sandboxing, we delegated execution to a standalone local Node.js script. This lets the active developer (Duc Anh) execute it directly in their native terminal using their GitHub PAT.

---

# Development Journal: AutoWash Pro Vision & Scope Revision and Case Collision Resolution

- **Date**: 2026-06-26
- **Author**: Agent (Antigravity) - Duc Anh (Planner / Reviewer)
- **Story/Feature Reference**: [VISION_SCOPE.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/VISION_SCOPE.md)

## Summary of Changes
- Overwrote the deprecated placeholder in the results directory with a comprehensive and professional project Vision & Scope document for AutoWash Pro in [VISION_SCOPE.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/VISION_SCOPE.md).
- Provided explicit instructions on resolving Git-on-Windows case-insensitive file collisions for `vision_scope.md` and `VISION_SCOPE.md`.

## Technical Decisions & Trade-offs
- **Reconstruction from Sources**: Recompiled the vision, objectives, scope, limitations, and stakeholders from raw project summaries and specs (`AutoWash_Pro_Project_Summary.md`, `Phân Tích Dự Án AutoWash.md`, and design specifications) to make [VISION_SCOPE.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/VISION_SCOPE.md) a complete, high-fidelity reference.

## Key Learnings & Gotchas
- **Gotcha**: On Windows, file names are case-insensitive. Attempting to track both `vision_scope.md` and `VISION_SCOPE.md` in Git creates a local filesystem collision, shadowing the actual content with the deprecation notice. The solution is to remove the lowercase version from Git's tracking database (`git rm --cached`).

---

# Development Journal: AutoWash Pro Mission-FR Summary Document Generation

- **Date**: 2026-06-26
- **Author**: Agent (Antigravity) - Duc Anh (Planner / Reviewer)
- **Story/Feature Reference**: [mission-FR.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/mission-FR.md)

## Summary of Changes
- Generated a consolidated mapping document [mission-FR.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results/mission-FR.md) in the `results` folder.
- Integrated the 13 Functional Requirements detailed breakdowns from the Stitch design plan file [2026-06-26-autowash-pro-stitch-design-plan.md](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/plans/2026-06-26-autowash-pro-stitch-design-plan.md) with their respective technical specifications in `results`.

## Technical Decisions & Trade-offs
- **Consolidated Tracking**: Created a single source of truth for task assignments, pairing developers, and specifications to align front-end and back-end tasks.

---

# Development Journal: AutoWash Pro Task Assignment Integration Across 13 Specs

- **Date**: 2026-06-26
- **Author**: Agent (Antigravity) - Duc Anh (Planner / Reviewer)
- **Story/Feature Reference**: [results](file:///d:/demoSWP/Vehicles-washing-G4-5/docs/superpowers/results)

## Summary of Changes
- Appended the pair programming task assignments and detailed sub-task breakdowns from the Stitch design plan into each of the 13 individual functional requirement specification files in the `results` directory (`FR-001-customer-registration-otp.md` to `FR-013-ai-campaign-promotion-builder.md`).

## Technical Decisions & Trade-offs
- **Localized Task Context**: Placing the assignments and breakdowns directly into the specification files ensures developers have immediate access to their tasks and pairing partners when viewing the requirements.
