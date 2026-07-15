# Design Specification: AutoWash Pro Admin UI Harmonization

This document defines the design and implementation intent for harmonizing the active Admin frontend panels so the entire Admin workspace shares one consistent premium visual language while preserving the current routing structure and ensuring the TypeScript production build remains fully green.

---

## 1. Context & Goals

* **Context**: The project already contains a newer Admin shell in `AdminRouter` and several panel-level implementations with different levels of visual maturity. `TierManagementPanel` and `VoucherManagementPanel` are currently the strongest references for polished Admin styling, while other active panels still use older or less aligned presentation patterns.
* **In Scope**:
  * The active Admin shell and active Admin panels rendered through `AdminRouter`
  * Visual consistency improvements across `AdminCustomerRegistryPage`, `CampaignBuilderPanel`, `RevenueAuditPanel`, `TierManagementPanel`, and `VoucherManagementPanel`
  * TypeScript-safe frontend cleanup required to keep or improve build stability
  * Removal or isolation of legacy Admin UI code only if it creates confusion, duplication, or maintenance risk
* **Out of Scope**:
  * Backend integration changes
  * New business features beyond what active Admin routes already expose
  * Large-scale application-wide rebranding outside the Admin area
* **Primary Goals**:
  * Make every active Admin tab feel like part of one premium system
  * Standardize hierarchy, spacing, surfaces, controls, and empty/loading states
  * Reduce visual drift between older and newer Admin panels
  * Leave the frontend in a TypeScript-clean state with `tsc && vite build` passing

---

## 2. Current-State Findings

### 2.1 Active Admin Architecture
* `AdminRouter` is the active Admin shell.
* The active top-level Admin pages are:
  * `AdminCustomerRegistryPage`
  * `CampaignBuilderPanel`
  * `RevenueAuditPanel`
  * `TierManagementPanel`
  * `VoucherManagementPanel`

### 2.2 Visual Baseline
* `TierManagementPanel` and `VoucherManagementPanel` already establish a clearer premium direction:
  * brighter elevated surfaces
  * stronger toolbar composition
  * refined badge treatment
  * more deliberate spacing and density
  * better modal and card polish
* `AdminCustomerRegistryPage`, `CampaignBuilderPanel`, and `RevenueAuditPanel` are functional but still need tighter alignment with that newer panel language.

### 2.3 Build Status
* The current frontend build succeeds with `tsc && vite build`.
* The immediate TypeScript goal is therefore not bug rescue, but preserving build health while refactoring panel UI and cleaning avoidable risk in the Admin frontend code.

---

## 3. Selected Approach

### 3.1 Chosen Direction: Harmonized Panel System
The implementation will standardize the active Admin panels around one shared visual language without forcing a full primitive-library refactor first.

This approach is chosen because it:
* achieves a visible quality jump across all active Admin tabs
* keeps scope controlled
* fits the current codebase, where a polished shell and two stronger panel references already exist
* reduces maintenance confusion caused by mixed generations of Admin styling

### 3.2 Reference Standard
The design reference for panel quality will be the combination of:
* `AdminRouter` for shell framing, overview rhythm, and premium workspace positioning
* `TierManagementPanel` for toolbar/header density, card elevation, glow usage, and configuration layout
* `VoucherManagementPanel` for card polish, modal language, action hierarchy, and empty-state quality

---

## 4. Design Decisions

### 4.1 Shared Visual Language
All active Admin panels should converge on the following:
* **Surface system**: bright premium cards over dark shell background, with consistent border opacity and subtle elevation
* **Spacing rhythm**: uniform padding scales for toolbars, content cards, tables, modal sections, and metric groups
* **Typography hierarchy**: clear separation between kicker, title, body copy, metadata, and small utility text
* **Action hierarchy**: one primary action, secondary neutral actions, and danger actions with consistent contrast and affordance
* **Badge system**: consistent pill shapes, uppercase/meta usage, and semantic color mapping
* **Form controls**: unified select, input, textarea, and button styling across filters and edit flows
* **State treatment**: empty states, helper messages, loading states, and terminal states should all look intentionally related

### 4.2 Panel-Level Adjustments

#### AdminCustomerRegistryPage
* Align header, metrics, filters, tables, and modal layout with the newer premium Admin language.
* Tighten table readability and make the modal feel like part of the same family as `VoucherManagementPanel`.
* Preserve current customer search/filter/edit functionality.

#### CampaignBuilderPanel
* Upgrade the split layout so form and preview feel closer to the visual maturity of `Tier` and `Voucher`.
* Improve CTA hierarchy, published promotion list styling, and empty/default draft presentation.
* Keep existing draft/publish behavior intact.

#### RevenueAuditPanel
* Upgrade summary cards, toolbar controls, audit table, and empty states to match the same Admin surface system.
* Improve consistency between analytics-oriented UI and the rest of the Admin workspace.

#### TierManagementPanel
* Use as a visual reference, but lightly tune if needed so details remain consistent with global Admin shell decisions.

#### VoucherManagementPanel
* Use as a visual reference, but lightly tune if needed so it stays aligned with any shared Admin conventions introduced during harmonization.

### 4.3 Legacy Handling
* The older `pages/admin/AdminPage.tsx` implementation is not the active Admin shell.
* During implementation, legacy Admin code should be reviewed and either:
  * left untouched but clearly non-authoritative if harmless, or
  * reduced/removed if it introduces confusion or raises maintenance risk
* No visual work should continue to target inactive Admin routes as if they were the current source of truth.

---

## 5. Component & Styling Strategy

### 5.1 Implementation Strategy
The work should favor targeted reuse and convergence, not a deep rewrite.

Preferred tactics:
* extract or reuse small shared class patterns only when it reduces duplication meaningfully
* preserve panel ownership of business logic
* focus most edits on layout, composition, CSS modules, and visual state treatment
* avoid introducing unnecessary abstraction if it slows delivery without improving consistency

### 5.2 File Boundaries
* `AdminRouter` remains the shell entry point.
* Active panel files remain the main ownership boundary for each Admin tab.
* Shared utilities may be introduced only if they help unify presentation safely and clearly.

---

## 6. TypeScript & Build Safety

### 6.1 Required Safety Rules
* No change may regress the current successful build.
* Avoid loose casting unless absolutely necessary and locally justified.
* Prefer explicit narrow types for UI state tied to filters, badges, panel modes, and status rendering.
* Remove dead or misleading code if it creates ambiguity during future Admin work.

### 6.2 Verification Target
After implementation, the frontend must pass:

`npm run build`

This includes both TypeScript compilation and Vite production build.

---

## 7. Verification Plan

### 7.1 Automated Verification
* Run the frontend production build:
  * `npm run build`

### 7.2 Manual Verification
* Open the Admin workspace and verify:
  * all tabs feel visually related at first glance
  * toolbar/filter controls look consistent across panels
  * cards, tables, and modals share the same visual system
  * empty states and helper messages feel intentional rather than default
  * no broken interactions were introduced in customer edit, campaign draft/publish, revenue filters, tier settings, or voucher actions

---

## 8. Implementation Notes

* The build currently passes before implementation, so success is measured by preserving that state while materially improving Admin coherence.
* This work is frontend-only and should not expand into backend integration or new feature scope.
* A git repository was not detected in the selected folder during design work, so documentation can be written locally even if no git commit step is available from this workspace state.
