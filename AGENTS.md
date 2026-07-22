# AutoWash Pro — Repository Guidance

## Verified repository facts
- Backend build file: Back-end/pom.xml.
- Backend target: Java 17; Spring Boot parent 3.5.6.
- No Maven wrapper is present; use an installed Maven executable.
- Frontend build file: Front-end/package.json.
- Frontend stack (as of 2026-07-21 rebuild): React 19 + Tailwind CSS 4 (@theme)
  + Vite 6 + TypeScript; TanStack Query, Zustand, react-router 7, react-hook-form
  + zod, motion, gsap, lucide-react, firebase (Phone OTP + Google auth),
  i18next + react-i18next (vi/en).
- Frontend scripts currently available: dev, build, preview, typecheck
  (`tsc --noEmit`).
- Frontend has no test or lint script. Do not invent either command.
- Re-verify this section whenever pom.xml, package.json, or lockfiles change.

## Source priority
1. The user's current request and the lecturer's original rubric.
2. A rubric checklist whose entries cite the original rubric.
3. Approved SRS and design documents.
4. Source code and executable tests.
5. Generated knowledge graphs, for navigation only.

## Start of a meaningful task
1. Read PROGRESS.md.
2. Read the relevant approved requirement and design documents.
3. Inspect the affected source and existing tests.
4. State assumptions when repository evidence is missing.
5. Keep unrelated user changes intact.

## Commands from repository root
- Install frontend dependencies: `npm --prefix Front-end ci`.
- Build frontend: `npm --prefix Front-end run build`.
- Run backend tests: `mvn -f Back-end/pom.xml test`.
- Record what actually ran. A command that exits 0 with zero tests executed is
  not behavioral test evidence.

## Workflow
- Superpowers owns planning, implementation workflow, TDD, and branch completion.
- ECC skills are advisory and never override repository evidence.
- Sub-agent orchestration is mandatory in both Codex and Claude Code. Before a
  non-trivial task is completed, the lead agent must dispatch every applicable
  role from the repository agent inventory in `ai/manifest.json`. Dispatch independent roles in
  parallel; do not use sub-agents for a task that is demonstrably one-step or
  purely conversational. The lead agent remains accountable for integrating
  evidence and making any write.
- Parallel dispatch protocol: at the start of a non-trivial task, the lead must
  identify independent work items and launch them in waves of 2 to 5 applicable
  sub-agents, up to the configured concurrency cap. It must give each child a
  bounded scope and expected deliverable, wait for every agent in the wave, and
  integrate the summaries before launching dependent work. Do not silently
  process independent analysis, testing, or review work sequentially.
- Parallel task execution for AutoWash Pro:

  ```markdown
  # GOOD: independent work in one parallel wave (maximum 5 agents)
  Launch 4 agents in parallel:
  1. `frontend-lead`: assess the affected React/TypeScript UI, state, and routes.
  2. `backend-lead`: assess Spring controllers, services, JPA, and API contracts.
  3. `testing-lead`: define unit, integration, and critical-flow validation.
  4. `security-reviewer`: review auth, authorization, payment, loyalty, input,
     secrets, and admin boundaries when they are in scope.

  Wait for all four summaries, then integrate the evidence and make the scoped
  implementation. Start a second wave only for work that depends on the first.

  # ALSO GOOD: focused frontend change
  Launch these independent specialists in parallel:
  1. `frontend-ui-specialist`: layout, accessibility, and responsive behavior.
  2. `frontend-state-specialist`: forms, routing, state, and API data flow.
  3. `frontend-quality-specialist`: types, performance, and regressions.
  4. `testing-lead`: validation plan and test gaps.

  # ALSO GOOD: focused backend change
  Launch these independent specialists in parallel:
  1. `backend-api-specialist`: REST contract, service behavior, validation, and errors.
  2. `backend-data-specialist`: JPA mapping, queries, transactions, and migrations.
  3. `backend-security-specialist`: authentication, authorization, inputs, and secrets.
  4. `testing-lead`: unit, integration, and critical-flow validation.

  # BAD: sequential analysis when the scopes are independent
  First inspect the frontend, then wait to inspect the backend, then wait to
  plan testing. This is prohibited unless a later scope genuinely depends on an
  earlier result.

  # BAD: parallel conflicting writes
  Do not assign two agents to edit the same files or make overlapping changes.
  Specialists are read-only; the lead performs one integrated, scoped write.
  ```
- Required role triggers: planner for complex features/refactors; architect for
  architecture decisions; tdd-guide for a behavior change or bug fix;
  code-reviewer after code changes; security-reviewer for authentication,
  authorization, payment, secrets, input handling, or admin operations;
  build-error-resolver after a failed build; e2e-runner for critical user-flow
  changes; refactor-cleaner for cleanup; doc-updater for documentation changes;
  rust-reviewer for Rust; and harmonyos-app-resolver for HarmonyOS/ArkTS.
- For a complex task, also split independent investigation across factual,
  senior-engineering, security, consistency, and redundancy perspectives when
  they are relevant. A runtime that cannot load a listed agent must report the
  mismatch instead of claiming the dispatch occurred.
- The lead agent follows the repository workflow definitions in `ai/workflows/`:
  plan before implementation, validate after implementation, then perform an
  independent review. These files define dispatch order and required evidence;
  they do not override the user request or approved requirements.
- Team hierarchy: dispatch `frontend-lead`, `backend-lead`, or `testing-lead`
  for work primarily in that area. Those leads must dispatch their named
  specialist children for every applicable concern. Codex is configured with
  `max_depth = 2` so a lead may call a specialist; do not create deeper trees.
- Write a failing test first for behavior changes when a test harness exists.
- Do not delete legacy code until it is recoverable through an approved Git
  strategy. The recovery point is recorded in docs/tooling/BASELINE.md.

## Verification
- Run the smallest relevant check first, then the broader build gate when practical.
- Never claim tests, builds, coverage, pass rates, or rubric thresholds without
  recorded evidence.
- Do not add a test or lint command until the repository implements that script.

## Security
- Never commit passwords, JWT secrets, private keys, tokens, service-account
  JSON, personal data, or local settings.
- Keep Spring secret properties environment-only.
- Treat authentication, authorization, checkout, loyalty points, and admin
  operations as security-sensitive.
- A removed secret must still be rotated or revoked. Deleting a file or adding a
  .gitignore rule is not sufficient.

## Evidence and progress
- Add an English AI log under docs/ai-logs/<milestone>/ after meaningful
  AI-assisted work.
- Record the task, human validation, exact evidence, accepted and rejected
  changes, and the related files or commit.
- Update PROGRESS.md with current state, decisions, next action, and blockers.
- Do not fabricate logs retroactively or invent rubric evidence.
- A .gitkeep marker is structure only. It is never evidence.

## Review
- Use `/codex:review` for an unsteered read-only review.
- Use `/codex:adversarial-review` for a focused challenge review.
- Human owners decide what is accepted and remain responsible for the result.
