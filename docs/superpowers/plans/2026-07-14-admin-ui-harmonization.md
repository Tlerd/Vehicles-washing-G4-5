# Admin UI Harmonization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harmonize the active Admin frontend panels so every tab in the live Admin workspace shares one premium visual language while keeping the TypeScript/Vite production build green.

**Architecture:** Keep `src/routes/AdminRouter.tsx` as the active Admin shell and upgrade the active panel modules in place instead of rebuilding the Admin area from scratch. Use `TierManagementPanel` and `VoucherManagementPanel` as the visual reference for surfaces, toolbar rhythm, badges, and modal polish, then pull `AdminCustomerRegistryPage`, `CampaignBuilderPanel`, and `RevenueAuditPanel` up to that same standard. Verify each slice with lightweight node-based contract tests plus the existing feature scripts and final production build.

**Tech Stack:** React 18, TypeScript 5, Vite 8, CSS Modules, Lucide React, node-based assertion scripts in `Front-end/scripts`

## Global Constraints

- Scope only the active Admin shell and active Admin panels rendered through `src/routes/AdminRouter.tsx`.
- Keep business behavior intact; this is a frontend harmonization pass, not a feature expansion.
- Use `src/features/admin/pages/TierManagementPanel.tsx` and `src/features/admin/pages/VoucherManagementPanel.tsx` as the visual reference standard.
- Do not introduce backend integration changes.
- No change may regress the current successful `npm run build` result.
- Avoid loose casting unless absolutely necessary and locally justified.
- Review `src/pages/admin/AdminPage.tsx` as legacy code; do not treat it as the active Admin source of truth.
- No git repository is currently available in the selected folder, so replace commit steps with explicit diff review notes during execution.

---

## File Map

### Active Shell
- Modify: `Front-end/src/routes/AdminRouter.tsx`
  - Keeps the Admin shell, nav items, topbar metadata, and active panel rendering.
- Modify: `Front-end/src/routes/AdminRouter.module.css`
  - Owns shell-level visual hierarchy, overview cards, spacing rhythm, and surface framing.

### Active Admin Panels
- Modify: `Front-end/src/features/admin/pages/AdminCustomerRegistryPage.tsx`
  - Keeps customer registry logic, booking log tab, customer profile modal, and embedded panel switching.
- Modify: `Front-end/src/features/admin/pages/AdminCustomerRegistryPage.module.css`
  - Owns the registry panel layout, table surface, modal system, metrics, and toolbar styling.
- Modify: `Front-end/src/features/admin/pages/CampaignBuilderPanel.tsx`
  - Keeps campaign draft/publish behavior and panel composition.
- Modify: `Front-end/src/features/admin/pages/CampaignBuilderPanel.module.css`
  - Owns campaign form, preview card, published list, and CTA hierarchy.
- Modify: `Front-end/src/features/admin/pages/RevenueAuditPanel.tsx`
  - Keeps revenue filters, metric summaries, and audit log rendering.
- Modify: `Front-end/src/features/admin/pages/RevenueAuditPanel.module.css`
  - Owns the revenue toolbar, summary cards, audit table, and empty state styling.
- Modify: `Front-end/src/features/admin/pages/TierManagementPanel.tsx`
  - Reference panel; only small consistency edits are allowed.
- Modify: `Front-end/src/features/admin/pages/TierManagementPanel.module.css`
  - Reference panel styles; only small consistency edits are allowed.
- Modify: `Front-end/src/features/admin/pages/VoucherManagementPanel.tsx`
  - Reference panel; only small consistency edits are allowed.
- Modify: `Front-end/src/features/admin/pages/VoucherManagementPanel.module.css`
  - Reference panel styles; only small consistency edits are allowed.

### Legacy Review
- Modify: `Front-end/src/pages/admin/AdminPage.tsx`
  - Legacy implementation; add a clear in-file legacy note only if it improves maintenance clarity without affecting active routing.

### Verification
- Create: `Front-end/scripts/admin-ui-harmonization-test.mjs`
  - Static contract test for active-shell/panel harmonization markers.
- Re-run: `Front-end/scripts/fr010-registry-test.mjs`
- Re-run: `Front-end/scripts/fr012-revenue-audit-test.mjs`
- Re-run: `Front-end/scripts/fr013-campaign-builder-test.mjs`
- Re-run: `Front-end/scripts/fr012-fr013-component-boundaries-test.mjs`
- Re-run: `Front-end/scripts/fr-admin-role-access-test.mjs`

---

### Task 1: Harmonize The Active Admin Shell

**Files:**
- Create: `Front-end/scripts/admin-ui-harmonization-test.mjs`
- Modify: `Front-end/src/routes/AdminRouter.tsx`
- Modify: `Front-end/src/routes/AdminRouter.module.css`

**Interfaces:**
- Consumes: Existing `AdminCustomerRegistryPage`, `CampaignBuilderPanel`, `RevenueAuditPanel`, `TierManagementPanel`, and `VoucherManagementPanel` exports.
- Produces:
  - Stable `adminPanels` metadata in `AdminRouter.tsx`
  - Harmonized shell classes in `AdminRouter.module.css`
  - Static contract test command: `node scripts/admin-ui-harmonization-test.mjs`

- [ ] **Step 1: Write the failing shell contract test**

```js
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const routerSource = await readFile(new URL('../src/routes/AdminRouter.tsx', import.meta.url), 'utf8');
const routerCss = await readFile(new URL('../src/routes/AdminRouter.module.css', import.meta.url), 'utf8');

assert.equal(routerSource.includes('const adminPanels = ['), true, 'AdminRouter should centralize active panel metadata');
assert.equal(routerSource.includes('sectionEyebrow'), true, 'AdminRouter should expose consistent shell copy tokens');
assert.equal(routerCss.includes('.overviewSection'), true, 'shell CSS should keep the overview surface');
assert.equal(routerCss.includes('.heroCard'), true, 'shell CSS should keep the hero card surface');

console.log('Admin shell harmonization contract passed');
```

- [ ] **Step 2: Run the shell contract test to verify it fails**

Run: `node scripts/admin-ui-harmonization-test.mjs`  
Expected: FAIL because `AdminRouter.tsx` does not yet define `adminPanels` or `sectionEyebrow`.

- [ ] **Step 3: Refactor `AdminRouter.tsx` to use one metadata source for panel copy and polish the shell composition**

```tsx
const adminPanels = [
  {
    id: 'customers' as const,
    label: 'Customers',
    icon: Users,
    description: 'Profiles, vehicles, and booking history',
    sectionEyebrow: 'Customer operations',
    sectionTitle: 'Registry and booking visibility in one premium workspace.',
  },
  {
    id: 'campaigns' as const,
    label: 'Campaigns',
    icon: Sparkles,
    description: 'AI-assisted promotion planning',
    sectionEyebrow: 'Campaign studio',
    sectionTitle: 'Draft and publish promotions with the same Admin surface language.',
  },
];
```

```css
.topbar {
  align-items: stretch;
  gap: 20px;
}

.heroCard,
.metricCard {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.78)),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 42%);
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.36);
}
```

- [ ] **Step 4: Re-run the shell contract test**

Run: `node scripts/admin-ui-harmonization-test.mjs`  
Expected: PASS with `Admin shell harmonization contract passed`.

- [ ] **Step 5: Review the shell diff**

Review:
- `src/routes/AdminRouter.tsx`
- `src/routes/AdminRouter.module.css`
- `scripts/admin-ui-harmonization-test.mjs`

Expected: The shell still renders the same five active panels, but topbar copy and overview surfaces now define the visual standard more explicitly.

---

### Task 2: Bring Customer Registry Up To The New Admin Standard

**Files:**
- Modify: `Front-end/scripts/admin-ui-harmonization-test.mjs`
- Modify: `Front-end/src/features/admin/pages/AdminCustomerRegistryPage.tsx`
- Modify: `Front-end/src/features/admin/pages/AdminCustomerRegistryPage.module.css`

**Interfaces:**
- Consumes:
  - `getFilteredCustomers()` from `Front-end/src/features/admin/customerRegistry.ts`
  - `getBookingPage()` and `shouldLoadNextPage()` from `Front-end/src/features/admin/bookingLog.ts`
  - `RevenueAuditPanel` and `CampaignBuilderPanel` component boundaries already imported by the page
- Produces:
  - Harmonized registry toolbar, metric cards, table, and modal surfaces
  - Preserved registry logic and booking log behavior
  - Passing commands: `node scripts/admin-ui-harmonization-test.mjs` and `node scripts/fr010-registry-test.mjs`

- [ ] **Step 1: Extend the contract test for registry panel markers**

```js
const registrySource = await readFile(new URL('../src/features/admin/pages/AdminCustomerRegistryPage.tsx', import.meta.url), 'utf8');
const registryCss = await readFile(new URL('../src/features/admin/pages/AdminCustomerRegistryPage.module.css', import.meta.url), 'utf8');

assert.equal(registrySource.includes('sectionKicker'), true, 'registry page should expose a consistent section kicker');
assert.equal(registrySource.includes('surfaceCard'), true, 'registry page should use a shared surface-card class name');
assert.equal(registryCss.includes('.surfaceCard'), true, 'registry CSS should define the shared card surface');
assert.equal(registryCss.includes('.modalHeader'), true, 'registry modal should keep an explicit premium header section');
```

- [ ] **Step 2: Run the registry contract plus FR010 test to verify the new assertions fail before implementation**

Run: `node scripts/admin-ui-harmonization-test.mjs ; node scripts/fr010-registry-test.mjs`  
Expected:
- The new harmonization assertions FAIL
- `FR010 registry tests passed` still prints, confirming filtering logic is stable before the UI refactor

- [ ] **Step 3: Update `AdminCustomerRegistryPage.tsx` to unify section framing and modal hierarchy without moving business logic**

```tsx
<section className={`${styles.registryPanel} ${styles.surfaceCard}`}>
  <header className={styles.sectionHeader}>
    <div>
      <span className={styles.sectionKicker}>Customer operations</span>
      <h2>Registry and booking oversight</h2>
      <p>Search customers, inspect loyalty activity, and move across booking visibility without leaving the same Admin surface language.</p>
    </div>
  </header>
```

```tsx
<div className={styles.modalHeader}>
  <div className={styles.modalIntro}>
    <span className={getTierClassName(selectedCustomer.tier)}>{selectedCustomer.tier}</span>
    <h2 id="customer-profile-title">{selectedCustomer.name}</h2>
    <p>{selectedCustomer.accumulatedPoints.toLocaleString('vi-VN')} points available</p>
  </div>
  <button className={styles.iconButton} onClick={closeCustomerProfile} aria-label="Close customer profile">
    <X size={18} aria-hidden="true" />
  </button>
</div>
```

- [ ] **Step 4: Update `AdminCustomerRegistryPage.module.css` to align cards, filters, tables, and modal surfaces with `Tier` / `Voucher` quality**

```css
.surfaceCard {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.8)),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 36%);
  box-shadow: 0 26px 70px rgba(2, 6, 23, 0.34);
}

.sectionKicker {
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #93c5fd;
}
```

- [ ] **Step 5: Re-run registry verification**

Run: `node scripts/admin-ui-harmonization-test.mjs ; node scripts/fr010-registry-test.mjs ; node scripts/fr012-fr013-component-boundaries-test.mjs`  
Expected:
- `Admin shell harmonization contract passed`
- `FR010 registry tests passed`
- `FR012/FR013 component boundary tests passed`

- [ ] **Step 6: Review the registry diff**

Review:
- `src/features/admin/pages/AdminCustomerRegistryPage.tsx`
- `src/features/admin/pages/AdminCustomerRegistryPage.module.css`
- `scripts/admin-ui-harmonization-test.mjs`

Expected: Customer, booking-log, metrics, and profile modal surfaces now feel like the same Admin family without moving registry logic into other files.

---

### Task 3: Harmonize Campaign And Revenue Panels

**Files:**
- Modify: `Front-end/scripts/admin-ui-harmonization-test.mjs`
- Modify: `Front-end/src/features/admin/pages/CampaignBuilderPanel.tsx`
- Modify: `Front-end/src/features/admin/pages/CampaignBuilderPanel.module.css`
- Modify: `Front-end/src/features/admin/pages/RevenueAuditPanel.tsx`
- Modify: `Front-end/src/features/admin/pages/RevenueAuditPanel.module.css`

**Interfaces:**
- Consumes:
  - `generateCampaignDraft()` and `publishCampaign()` from `Front-end/src/features/admin/campaignBuilder.ts`
  - `getRevenueSummary()` and `getPointAuditRows()` from `Front-end/src/features/admin/revenueAudit.ts`
- Produces:
  - Harmonized analytics and campaign surfaces
  - Preserved FR012 and FR013 business logic
  - Passing commands: `node scripts/fr012-revenue-audit-test.mjs`, `node scripts/fr013-campaign-builder-test.mjs`

- [ ] **Step 1: Extend the harmonization contract for the campaign and revenue panels**

```js
const campaignSource = await readFile(new URL('../src/features/admin/pages/CampaignBuilderPanel.tsx', import.meta.url), 'utf8');
const revenueSource = await readFile(new URL('../src/features/admin/pages/RevenueAuditPanel.tsx', import.meta.url), 'utf8');
const campaignCss = await readFile(new URL('../src/features/admin/pages/CampaignBuilderPanel.module.css', import.meta.url), 'utf8');
const revenueCss = await readFile(new URL('../src/features/admin/pages/RevenueAuditPanel.module.css', import.meta.url), 'utf8');

assert.equal(campaignSource.includes('sectionKicker'), true, 'campaign panel should expose a section kicker');
assert.equal(revenueSource.includes('sectionKicker'), true, 'revenue panel should expose a section kicker');
assert.equal(campaignCss.includes('.surfaceCard'), true, 'campaign CSS should define premium surfaces');
assert.equal(revenueCss.includes('.surfaceCard'), true, 'revenue CSS should define premium surfaces');
```

- [ ] **Step 2: Run the FR012 / FR013 checks and confirm the new harmonization assertions fail first**

Run: `node scripts/admin-ui-harmonization-test.mjs ; node scripts/fr012-revenue-audit-test.mjs ; node scripts/fr013-campaign-builder-test.mjs`  
Expected:
- The new harmonization assertions FAIL
- Existing FR012 / FR013 behavior tests still PASS before the visual changes land

- [ ] **Step 3: Update `CampaignBuilderPanel.tsx` and `CampaignBuilderPanel.module.css` to match the Admin visual system**

```tsx
<section className={`${styles.panel} ${styles.surfaceCard}`}>
  <header className={styles.sectionHeader}>
    <div>
      <span className={styles.sectionKicker}>Campaign studio</span>
      <h2>Draft promotions with the same polished controls used across Admin.</h2>
      <p>Keep campaign ideation, preview, and publish actions visually aligned with the rest of the workspace.</p>
    </div>
  </header>
```

```css
.surfaceCard {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(15, 23, 42, 0.8)),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 40%);
}
```

- [ ] **Step 4: Update `RevenueAuditPanel.tsx` and `RevenueAuditPanel.module.css` to match the Admin visual system**

```tsx
<section className={`${styles.panel} ${styles.surfaceCard}`}>
  <header className={styles.sectionHeader}>
    <div>
      <span className={styles.sectionKicker}>Revenue intelligence</span>
      <h2>Audit revenue and loyalty movement without dropping out of the premium Admin rhythm.</h2>
      <p>Filters, summary cards, and audit logs should scan like one coherent operational surface.</p>
    </div>
  </header>
```

```css
.revenueCard,
.tableWrap,
.surfaceCard {
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 22px 60px rgba(2, 6, 23, 0.28);
}
```

- [ ] **Step 5: Re-run panel verification**

Run: `node scripts/admin-ui-harmonization-test.mjs ; node scripts/fr012-revenue-audit-test.mjs ; node scripts/fr013-campaign-builder-test.mjs ; node scripts/fr012-fr013-component-boundaries-test.mjs`  
Expected:
- Harmonization contract PASS
- `FR012 revenue audit tests passed`
- `FR013 campaign builder tests passed`
- `FR012/FR013 component boundary tests passed`

- [ ] **Step 6: Review the campaign/revenue diff**

Review:
- `src/features/admin/pages/CampaignBuilderPanel.tsx`
- `src/features/admin/pages/CampaignBuilderPanel.module.css`
- `src/features/admin/pages/RevenueAuditPanel.tsx`
- `src/features/admin/pages/RevenueAuditPanel.module.css`
- `scripts/admin-ui-harmonization-test.mjs`

Expected: Campaign and Revenue now read as first-class Admin panels instead of adjacent utilities with a weaker visual finish.

---

### Task 4: Final Consistency Pass On Reference Panels And Legacy Clarity

**Files:**
- Modify: `Front-end/scripts/admin-ui-harmonization-test.mjs`
- Modify: `Front-end/src/features/admin/pages/TierManagementPanel.tsx`
- Modify: `Front-end/src/features/admin/pages/TierManagementPanel.module.css`
- Modify: `Front-end/src/features/admin/pages/VoucherManagementPanel.tsx`
- Modify: `Front-end/src/features/admin/pages/VoucherManagementPanel.module.css`
- Modify: `Front-end/src/pages/admin/AdminPage.tsx`

**Interfaces:**
- Consumes: Active panel exports used by `AdminRouter.tsx`
- Produces:
  - Small consistency edits to the reference panels
  - An explicit legacy marker in `src/pages/admin/AdminPage.tsx` if needed
  - Final harmonization contract coverage for all active Admin surfaces

- [ ] **Step 1: Extend the harmonization contract for reference-panel alignment and legacy clarity**

```js
const tierSource = await readFile(new URL('../src/features/admin/pages/TierManagementPanel.tsx', import.meta.url), 'utf8');
const voucherSource = await readFile(new URL('../src/features/admin/pages/VoucherManagementPanel.tsx', import.meta.url), 'utf8');
const legacyAdminSource = await readFile(new URL('../src/pages/admin/AdminPage.tsx', import.meta.url), 'utf8');

assert.equal(tierSource.includes('section') || tierSource.includes('toolbar'), true, 'tier panel should stay in the active Admin surface family');
assert.equal(voucherSource.includes('metaRow'), true, 'voucher panel should retain the shared toolbar metadata rhythm');
assert.equal(legacyAdminSource.includes('Legacy Admin page') || legacyAdminSource.includes('AdminRouter'), true, 'legacy Admin page should clearly indicate the active shell');
```

- [ ] **Step 2: Run the harmonization test to confirm the legacy/reference assertions fail first**

Run: `node scripts/admin-ui-harmonization-test.mjs`  
Expected: FAIL because the legacy page does not yet contain a clear inactive note and the final reference assertions are not in place.

- [ ] **Step 3: Make small consistency edits to `TierManagementPanel` and `VoucherManagementPanel` only where the shell language has drifted**

```tsx
<div className={styles.metaRow}>
  <span className={styles.metaPill}>4 active tiers</span>
  <span className={styles.metaPill}>Premium configuration surface</span>
</div>
```

```css
.metaPill {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.64);
}
```

- [ ] **Step 4: Add a clear non-authoritative note to the legacy Admin page without changing active routing**

```tsx
/**
 * Legacy Admin page retained for reference only.
 * The active Admin workspace is rendered from `src/routes/AdminRouter.tsx`.
 */
import React, { useState, useEffect, useRef } from 'react';
```

- [ ] **Step 5: Re-run the final harmonization contract**

Run: `node scripts/admin-ui-harmonization-test.mjs ; node scripts/fr-admin-role-access-test.mjs`  
Expected:
- Harmonization contract PASS
- `FR admin role access tests passed`

- [ ] **Step 6: Review the final consistency diff**

Review:
- `src/features/admin/pages/TierManagementPanel.tsx`
- `src/features/admin/pages/TierManagementPanel.module.css`
- `src/features/admin/pages/VoucherManagementPanel.tsx`
- `src/features/admin/pages/VoucherManagementPanel.module.css`
- `src/pages/admin/AdminPage.tsx`

Expected: The reference panels still look like the highest-quality Admin surfaces, and the legacy page is no longer easy to mistake for the active Admin entry point.

---

### Task 5: Run Full Frontend Verification

**Files:**
- Re-run only; no new source files required

**Interfaces:**
- Consumes: Outputs of Tasks 1-4
- Produces: Final confidence that the Admin harmonization preserved routing, pure helper behavior, and production build health

- [ ] **Step 1: Run the static Admin/UI verification scripts**

Run: `node scripts/admin-ui-harmonization-test.mjs ; node scripts/fr010-registry-test.mjs ; node scripts/fr012-revenue-audit-test.mjs ; node scripts/fr013-campaign-builder-test.mjs ; node scripts/fr012-fr013-component-boundaries-test.mjs ; node scripts/fr-admin-role-access-test.mjs`  
Expected:
- `Admin shell harmonization contract passed`
- `FR010 registry tests passed`
- `FR012 revenue audit tests passed`
- `FR013 campaign builder tests passed`
- `FR012/FR013 component boundary tests passed`
- `FR admin role access tests passed`

- [ ] **Step 2: Run the production build**

Run: `npm run build`  
Expected:
- `tsc && vite build`
- Vite build completes successfully
- No TypeScript compile failures

- [ ] **Step 3: Review the complete diff**

Review:
- `src/routes/AdminRouter.tsx`
- `src/routes/AdminRouter.module.css`
- `src/features/admin/pages/AdminCustomerRegistryPage.tsx`
- `src/features/admin/pages/AdminCustomerRegistryPage.module.css`
- `src/features/admin/pages/CampaignBuilderPanel.tsx`
- `src/features/admin/pages/CampaignBuilderPanel.module.css`
- `src/features/admin/pages/RevenueAuditPanel.tsx`
- `src/features/admin/pages/RevenueAuditPanel.module.css`
- `src/features/admin/pages/TierManagementPanel.tsx`
- `src/features/admin/pages/TierManagementPanel.module.css`
- `src/features/admin/pages/VoucherManagementPanel.tsx`
- `src/features/admin/pages/VoucherManagementPanel.module.css`
- `src/pages/admin/AdminPage.tsx`
- `scripts/admin-ui-harmonization-test.mjs`

Expected: Every active Admin tab now shares one consistent aesthetic level, no active route depends on the legacy page, and the production build remains green.

---

## Self-Review

### Spec Coverage
- Active Admin shell covered in Task 1.
- `AdminCustomerRegistryPage` harmonization covered in Task 2.
- `CampaignBuilderPanel` and `RevenueAuditPanel` harmonization covered in Task 3.
- Reference panel alignment and legacy handling covered in Task 4.
- TypeScript/Vite build verification covered in Task 5.

### Placeholder Scan
- No `TODO`, `TBD`, or "implement later" markers remain.
- Each task includes exact files, commands, and concrete code snippets.

### Type Consistency
- Active panel names match the current router exports:
  - `AdminCustomerRegistryPage`
  - `CampaignBuilderPanel`
  - `RevenueAuditPanel`
  - `TierManagementPanel`
  - `VoucherManagementPanel`
- Verification commands align with the existing script names in `Front-end/scripts`.
