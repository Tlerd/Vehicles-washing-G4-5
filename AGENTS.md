# AutoWash Pro — Repository Guidance

## Verified repository facts
- Backend build file: Back-end/pom.xml.
- Backend target: Java 17; Spring Boot parent 3.5.6.
- No Maven wrapper is present; use an installed Maven executable.
- Frontend build file: Front-end/package.json.
- Frontend scripts currently available: dev, build, preview.
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
