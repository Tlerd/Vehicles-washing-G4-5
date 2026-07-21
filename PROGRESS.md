# Progress — AutoWash Pro

## Current state
- Last AI-assisted work: 2026-07-21 — corrected public role routing and entry
  points: the landing header now opens a guest overview through a person icon;
  public booking CTAs go directly to `/guest/booking` without the identity
  modal; post-login and post-registration redirect by the server-returned role
  (`CUSTOMER` → `/app`, `STAFF` → `/staff`, `ADMIN` → `/admin`); and a customer
  layout role guard prevents staff/admin from rendering the customer console.
  Added the shared vehicle-brand dropdown to the guest booking wizard. The
  proposed SQL migration for persisting anonymous bookings was deliberately
  rejected after independent code/security review: current backend booking
  APIs, JPA mappings, loyalty processing, and OTP verification do not support
  guest records. `npm --prefix Front-end run typecheck`, frontend build, and
  `mvn -f Back-end/pom.xml test` passed (7 backend tests). Browser E2E could
  not run because no controllable browser was available. See
  docs/ai-logs/m1/2026-07-21-role-routing-guest-booking-audit.md.
- Last AI-assisted work: 2026-07-21 — imported the upstream behavioral
  guidelines from `multica-ai/andrej-karpathy-skills` into the existing root
  `CLAUDE.md`, preserving project-specific instructions. Upstream commit:
  `daced9bd64f25908ebedeb4701fb406985dc8366`. See
  docs/ai-logs/m1/2026-07-21-andrej-karpathy-guidelines-import.md.
- Milestone: VERIFY WITH THE LECTURER OR TEAM
- Status: Full 11-role Claude/Codex sub-agent inventory is provisioned with
  mandatory dispatch policy, canonical local ECC inventory, and Codex skill
  mirrors; Superpowers
  installation was attempted but is blocked by this managed runtime's user-cache
  permissions; runtime discovery, vendor approval, human approval, and security
  blockers remain open
- Baseline commit: see docs/tooling/BASELINE.md
- Active scope: Owner-directed FR-001..FR-013 completion, phased with explicit
  approval gates between phases. Audit + Phase 0 done; Phase 1 not started.
- Last AI-assisted work: 2026-07-21 — FR-001..FR-013 current-state audit
  (4-agent parallel dispatch: frontend-lead, backend-lead, testing-lead,
  security-reviewer, 245 tool calls) plus Phase 0 startup verification.
  Backend and frontend confirmed running locally with live evidence (not code
  reading alone): Swagger/OpenAPI both HTTP 200, 26 real endpoints enumerated,
  no `/payments/**` endpoint exists; landing "Book now" CTA verified live in
  Chrome to skip the required Sign in/Register/Guest choice and jump straight
  into the (fully mock-data) booking wizard. Found a new CRITICAL, still-open
  vulnerability: `CustomerController`/`CustomerServiceImpl` has no role/
  ownership matcher in SecurityConfig, so any authenticated CUSTOMER can list
  all customers, IDOR-read any account, and overwrite any customer's
  `passwordHash` (including the hardcoded-phone ADMIN account) via
  `PUT /api/v1/customers/{id}` — a full privilege-escalation path. Fixed and
  live-verified in the same work item (see Security blockers below), along
  with implementing the Phase 0 "Book now" identity-choice modal (Sign in /
  Register / Continue as guest), live-verified in Chrome for all three
  paths. `npx tsc --noEmit` and `npm run build` both clean. Booking wizard
  itself (FR-004) is still 100% mock data — intentionally left for Phase 1,
  pending owner approval. See
  docs/ai-logs/m1/2026-07-21-fr001-013-audit-and-phase0.md.
- Previous AI-assisted work: 2026-07-21 — real backend auth rebuild after owner
  testing surfaced the Phase 2 login was Firebase-only (no password). The
  backend already has its own complete phone+password JWT auth
  (`/api/v1/auth/login`, `/api/v1/auth/register`) independent of Firebase;
  Firebase now only verifies phone ownership during registration. Garage
  rewired to the real `/api/v1/vehicles` API (Dashboard/Points/Vouchers/
  History/BookingDetail still on mock data — known gap, not yet migrated).
  Also fixed: WeekGrid sticky/overflow bug (CSS Grid rebuild + a footer
  z-index conflict found only by live browser testing after the first fix
  round reported clean), VN-timezone date bugs (BR-027, date-fns-tz), vehicle
  brand picker, booking contact email field, STAFF/ADMIN password rotation.
  See docs/ai-logs/m1/2026-07-21-fe-bugfix-real-auth.md
- Last AI-assisted work: 2026-07-21 — root README rewritten to match the
  refactored source: React 19/Tailwind 4/Vite 6 frontend, Java 17/Spring Boot
  backend, safe local configuration and current run commands. It explicitly
  distinguishes implemented Garage/JWT work from mock booking/customer pages,
  unimplemented payment and v2 design intent; see
  docs/ai-logs/m1/2026-07-21-readme-refactor-update.md.
- Previous AI-assisted work: 2026-07-21 — Front-end rebuild Phase 2 (Firebase
  Phone-OTP + Google auth, dark/light theme, vi/en i18n, customer console:
  dashboard/garage/points/vouchers/history/booking-detail with check-in and
  self-complete per D-01, feedback per lỗi #13; local DB migrated and backend
  verified running with Firebase Admin SDK live); see
  docs/ai-logs/m1/2026-07-21-fe-rebuild-phase2.md
- Previous AI-assisted work: 2026-07-21 — Front-end rebuild Phase 1 (landing +
  6-step booking wizard on React 19 / Tailwind 4 / Vite 6, mock data, builds and
  runs); see docs/ai-logs/m1/2026-07-21-fe-rebuild-phase1.md and
  docs/superpowers/specs/2026-07-21-customer-fe-rebuild-design.md
- Previous AI-assisted work: 2026-07-21 — FE/BE/testing sub-agent hierarchy
  provisioned; see docs/ai-logs/m1/2026-07-21-team-hierarchy-subagents.md
- Previous AI-assisted work: 2026-07-21 — sub-agent project workflow defined;
  see docs/ai-logs/m1/2026-07-21-subagent-workflow-definition.md
- Previous AI-assisted work: 2026-07-21 — role orchestration inventory
  provisioned; see docs/ai-logs/m1/2026-07-21-role-orchestration-inventory.md
- Previous AI-assisted work: 2026-07-21 — Superpowers installation attempted; see
  docs/ai-logs/m1/2026-07-21-superpowers-installation-attempt.md
- Previous AI-assisted work: 2026-07-21 — core AI harness provisioned; see
  docs/ai-logs/m1/2026-07-21-ai-harness-core-provisioning.md
- Previous AI-assisted work: 2026-07-21 — AI harness setup v1 runbook revised;
  see docs/ai-logs/m1/2026-07-21-ai-harness-setup-v1-revision.md
- Earlier AI-assisted work: 2026-07-21 — repository documentation reorganized;
  see docs/ai-logs/m1/2026-07-21-document-structure-reorganization.md
- Earlier work: 2026-07-20 — see
  docs/ai-logs/m1/2026-07-20-codebase-knowledge-graph-and-onboarding.md
  (filed under m1 as a placeholder; move once the milestone is confirmed)

## Verified repository facts
- Backend targets Java 17 and uses Spring Boot parent 3.5.6.
- Maven wrapper is not present.
- Frontend scripts currently available: dev, build, preview, typecheck
  (`tsc --noEmit`). Stack rebuilt 2026-07-21 to React 19 + Tailwind 4 + Vite 6.
- Frontend test and lint scripts are not present.
- Frontend build evidence 2026-07-21 (Phase 2, latest): `npm run build`
  (vite 6.4.3) exits 0; `npx tsc --noEmit` exits 0; dev server renders landing,
  booking wizard, login, and the /app/* redirect-when-unauthenticated with no
  console errors. First recorded successful FE build in the repo (Phase 1).
- Local backend run evidence 2026-07-21: `autowash_pro` SQL Server DB migrated
  (FR001_FR013 + FR004 scripts applied, idempotent); `mvn spring-boot:run`
  starts in ~4.5s with Firebase Admin SDK initialized and DB connected
  (Back-end/run-local.ps1 automates env loading + JWT secret generation).
- No Back-end/src/test tree exists. JUnit appears in pom.xml dependencies only;
  it is not test evidence.
- Repository size as scanned on 2026-07-20: 195 files analysed, 66 filtered.
- docs/srs/SRS.md, docs/design/architecture.md, docs/design/ERD.md,
  docs/design/state-diagram.md, docs/rubric/rubric-checklist.md,
  docs/testing/test-cases.md and docs/testing/coverage-report.md are each
  3-line TODO stubs. Nothing in this repository defines FR001-FR013.

## Decisions
- Superpowers owns the development workflow and TDD.
- ECC is vendored selectively for stack-specific guidance.
- Understand-Anything is for navigation, not requirements.
- Codex provides an independent review pass.
- The 11 ECC-listed roles have project adapters for Codex and Claude Code. Root
  AGENTS.md mandates dispatch of every applicable role; Claude planner runtime
  smoke test passed, while Codex planner runtime smoke test is blocked by its
  Windows sandbox helper and must be re-run after remediation.
- `ai/workflows/` defines the shared planning, implementation, verification,
  and review dispatch lifecycle for those roles.
- FE/BE/testing leads and their specialist children are provisioned. Codex
  allows root → lead → specialist depth, but runtime validation remains blocked.
- AI-HARNESS-SETUP_v1.md is the migration runbook. The core harness has been
  provisioned, but runtime discovery, vendor approval, Superpowers delivery,
  build/test evidence, security review, and human approval are still separate
  gates.

## Open findings from the 2026-07-20 codebase analysis
Navigation data, not requirements. None of this satisfies a rubric item.
- [x] Superseded 2026-07-21: docs/srs/FR-001-*.md through FR-013-*.md,
      business_rules.md, and docs/design/01-07 now exist as substantive v2
      specs (they did not at 2026-07-20 scan time). FR-001..FR-013 ARE defined
      in this repository. The lecturer's original rubric is still not
      attached and should still be reconciled against these docs, but the
      "empty stubs" premise no longer holds — see
      docs/ai-logs/m1/2026-07-21-fr001-013-audit-and-phase0.md.
- [ ] Payment is not implemented. No payment entity, table, settlement or
      reconciliation code exists; a VietQR string is built in
      BookingManagementService.toResponse and rendered by StepPayment, and
      confirming is a UI acknowledgement only. Reconcile against the rubric.
- [x] Dead code finding superseded: the entire pre-rebuild Front-end/src tree
      (including Front-end/src/pages/booking/** and services/mockStore.ts) was
      replaced by the 2026-07-21 Phase 1/2 rebuild (React 19/Tailwind 4/Vite 6).
      Old tree recoverable via git at the BASELINE.md commit if needed.
- [ ] TierManagementPanel and VoucherManagementPanel are read-only shells with
      disabled controls and no backing API.
- [x] .gitignore covers .ua/tmp/ and .ua/.trash-*/ as rechecked on
      2026-07-21. Existing .ua artifacts still require scoped human review
      before any commit.
- [ ] Human review of .ua/knowledge-graph.json, .ua/domain-graph.json and
      docs/ONBOARDING.md has not been performed. Nothing is committed.

## Security blockers
- [x] **CRITICAL — full privilege escalation.** Found and fixed 2026-07-21.
      `Back-end/src/main/java/com/autowashpro/controller/CustomerController.java`
      and `CustomerServiceImpl` are not listed among the role-scoped matchers
      in `SecurityConfig.java` (lines 35-47), so `/api/v1/customers/**` falls
      through to the generic `.anyRequest().authenticated()` rule. Any
      authenticated user of any role can: `GET /api/v1/customers` to dump
      every customer's PII with no pagination or role filter; IDOR-read any
      single account by id; `PUT /api/v1/customers/{id}` to overwrite an
      arbitrary customer's `passwordHash` verbatim (no re-hash, no ownership
      check — `CustomerServiceImpl.java:61`); `DELETE /api/v1/customers/{id}`
      to delete any account, including ADMIN, with no ownership check. Because
      ADMIN/STAFF share the same `customers` table and the seeded ADMIN's
      phone is a hardcoded, publicly-known constant (`+84900000002`), a
      freshly self-registered customer can look up the admin's id, overwrite
      its password hash, then log in as ADMIN via the normal login endpoint —
      a complete auth-bypass path. **Fixed 2026-07-21**:
      `/api/v1/customers/**` now requires `hasRole("ADMIN")` in
      `SecurityConfig.java`; `passwordHash` removed from `CustomerRequest`
      and from both `CustomerServiceImpl.updateCustomer()` and
      `CustomerMapper.toEntity()`. Live-verified after restart: a forged
      CUSTOMER-role JWT now gets 403 on `GET /api/v1/customers` and
      `PUT /api/v1/customers/1` (was 200); a forged ADMIN-role JWT still
      gets 200; unrelated CUSTOMER-scoped endpoints re-checked unaffected.
      See docs/ai-logs/m1/2026-07-21-fr001-013-audit-and-phase0.md. Not yet
      owner-reviewed.
- [ ] Firebase service-account JSON (project washpro-116cd) was supplied via
      chat + a local Downloads-folder file on 2026-07-21. It is now only in
      the gitignored Back-end/src/main/resources/firebase-service-account.json
      (verified with `git check-ignore`), but rotation of that key by the
      cloud owner (regenerate in Firebase Console → Service accounts) has NOT
      been confirmed — treat as exposed until rotated. The Downloads copy was
      left in place at the owner's explicit instruction.
- [ ] Local SQL Server `sa` password was shared via chat on 2026-07-21 and is
      now only in the gitignored Back-end/.env. Local-dev-only exposure (not a
      cloud credential), but still worth rotating on this machine if the team
      wants a clean slate.
- [x] STAFF (+84900000001) and ADMIN (+84900000002) DB passwords rotated
      2026-07-21 (fresh bcrypt hashes, verified via live login), replacing the
      seeder's hardcoded Staff@123/Admin@123. New passwords reported to the
      owner in chat only, not written to any file. **Still open**:
      Back-end/src/main/java/com/autowashpro/config/SystemAccountSeeder.java
      itself still hardcodes Staff@123/Admin@123 in tracked source — those
      values are permanently exposed via git history regardless of what's live
      in the DB now, and the seeder will silently stop mattering only because
      `existsByPhone` skips already-seeded rows; it should still be changed to
      not hardcode plaintext demo passwords.
- [ ] Front-end/src/features/auth/roleAccess.ts (LOGIN_ROLE_OPTIONS, the
      earlier finding's FE half) no longer exists — the whole pre-rebuild
      Front-end/src tree was replaced 2026-07-21 (see "Dead code" above), and
      admin/staff login UI is out of scope for the Phase 1/2 customer rebuild.
- [ ] Plain sensitive assignments in application.properties have been replaced
      with environment-only placeholders, with deployment secrets configured
      outside Git.
- [ ] Other credential-like values exposed in repository history have been
      assessed and rotated where applicable.
- [ ] The team has recorded its decision about coordinated history rewriting.

## Next
0. Correction: the 2026-07-20 finding that docs/srs and docs/design are "empty
   stubs" is stale/wrong — verified 2026-07-21 that docs/srs/FR-001..FR-013,
   business_rules.md, and docs/design/01-07 are substantive v2 specs. They ARE
   the approved requirement source; the gap is that current source code
   implements an earlier, simpler design than these v2 docs describe (see
   docs/ai-logs/m1/2026-07-21-fr001-013-audit-and-phase0.md for the full
   per-FR reconciliation). CRITICAL CustomerController fix is applied and
   live-verified (not yet owner-reviewed). Awaiting owner decision on the
   phased FR-001..013 completion plan (which phase to approve next) before
   any further implementation.
1. Attach the original rubric and reconcile it against the now-found
   docs/srs/FR-001..FR-013 docs (see correction above).
2. [x] CRITICAL CustomerController privilege-escalation vulnerability fixed
   and live-verified 2026-07-21 (see Security blockers). Still open:
   complete and record the other open security blockers: rotate the Firebase
   service-account key and the seeded STAFF/ADMIN backend accounts.
3. [x] Frontend build/backend run commands executed and evidence recorded —
   see "Frontend build evidence" and "Local backend run evidence" above and
   docs/ai-logs/m1/2026-07-21-fe-rebuild-phase1.md /
   2026-07-21-fe-rebuild-phase2.md. Still open: `mvn -f Back-end/pom.xml test`
   has not been run (no Back-end/src/test tree exists to run).
4. Human-review the generated graphs and docs/ONBOARDING.md, then decide whether
   to commit .ua/ artifacts to the repository.
5. Decide whether the empty SRS, ERD, state-diagram and rubric stubs will be
   written or removed, and reconcile the payment gap against the rubric.
6. In the developer's normal terminal, install Superpowers with `codex plugin
   add superpowers@openai-curated`, verify it with `codex plugin list`, then
   update D-001 with the observed installed version. Complete D-002 through D-004,
   run the PowerShell 7 verifier and actual Claude/Codex runtime discovery, then
   record only observed results.
7. Repair the Codex Windows sandbox-helper installation, then re-run the
   read-only sub-agent smoke test before treating Codex dispatch as verified.

## Evidence
- Link command logs, reports, pull requests, commits, screenshots, or exports.
- Do not mark an item complete without evidence.
- 2026-07-21 FE rebuild Phase 2 (auth, customer console, theme, i18n):
  docs/ai-logs/m1/2026-07-21-fe-rebuild-phase2.md
  `npx tsc --noEmit` and `npm run build` both clean (0 errors) after an 18-agent
  Workflow build + a manual review-finding fix pass (26 findings triaged, all
  HIGH/MEDIUM addressed or explicitly deferred to Phase 3 with reasoning).
  Backend verified running locally with DB connected and Firebase Admin SDK
  initialized. Browser-verified: dark mode, i18n toggle, protected-route
  redirect, login form validation — no console errors on any checked route.
- 2026-07-21 FE rebuild Phase 1 (landing + booking wizard):
  docs/ai-logs/m1/2026-07-21-fe-rebuild-phase1.md
  First recorded successful `npm run build` / `npx tsc --noEmit` in this repo.
- 2026-07-21 team hierarchy sub-agents:
  docs/ai-logs/m1/2026-07-21-team-hierarchy-subagents.md
  Structural verification passed for 22 agents; Codex nested runtime remains
  BLOCKED by the sandbox-helper issue.
- 2026-07-21 sub-agent workflow definition:
  docs/ai-logs/m1/2026-07-21-subagent-workflow-definition.md
  Documentation-only workflow definitions were added; Codex runtime dispatch
  remains BLOCKED by the existing sandbox-helper issue.
- 2026-07-21 role orchestration inventory:
  docs/ai-logs/m1/2026-07-21-role-orchestration-inventory.md
  Structural validation passed. Claude `planner` smoke test passed; Codex
  attempted the requested planner dispatch but the child sandbox setup failed,
  so Codex runtime validation remains BLOCKED.
- 2026-07-21 Superpowers installation attempt:
  docs/ai-logs/m1/2026-07-21-superpowers-installation-attempt.md
  The official Claude and Codex installers were both blocked by managed-runtime
  denial of user-cache writes. No plugin or repository setting changed.
- 2026-07-21 core AI harness provisioning:
  docs/ai-logs/m1/2026-07-21-ai-harness-core-provisioning.md
  Core structure and SHA-256 parity checks passed. Runtime discovery, native
  PowerShell 7 verification, builds, tests, security review, and human approval
  were not run.
- 2026-07-21 AI harness setup v1 guide revision:
  docs/ai-logs/m1/2026-07-21-ai-harness-setup-v1-revision.md
  Documentation-only change. Static structure checks passed; native parsers,
  runtime discovery, builds, tests, security review, and human approval were
  not run.
- 2026-07-20 codebase analysis:
  docs/ai-logs/m1/2026-07-20-codebase-knowledge-graph-and-onboarding.md
  Artifacts: docs/ONBOARDING.md, .ua/knowledge-graph.json (439 nodes,
  873 edges), .ua/domain-graph.json (6 domains, 21 flows, 90 steps),
  .ua/meta.json, .ua/fingerprints.json. Analysis commit 65d4a94.
  Graph validation passed structurally, 0 errors and 1 warning. This is
  navigation data only. It contains no test, build or coverage evidence, and
  no human review or commit has occurred.
