# AI log — 2026-07-21 — README update after refactor

## Task

Rewrite the root README so it describes the refactored AutoWash Pro repository accurately.

## Human validation

The owner requested a README rewrite. No claim of user acceptance, deployment, payment integration, or additional runtime validation was inferred.

## Evidence used

- `Front-end/package.json` confirms React 19, Vite 6, Tailwind 4 and the only available scripts: `dev`, `build`, `preview`, and `typecheck`.
- `Back-end/pom.xml`, `Back-end/.env.example`, `Back-end/run-local.ps1`, and `application.properties` confirm Java 17, Spring Boot 3.5.6, SQL Server, environment-only secrets and the local runner.
- `docs/ai-logs/m1/2026-07-21-fe-rebuild-phase2.md` and `2026-07-21-fe-bugfix-real-auth.md` confirm that only Garage is connected to the real API; the remaining customer pages and booking flow retain mock behaviour.
- `PROGRESS.md` records the known payment, test, security and documentation limitations.
- `docs/srs/VISION_SCOPE.md` and `docs/design/01-LUONG-CHAY-MOI.md` were used only to label the v2 target flow, not as implementation evidence.

## Accepted changes

- Replaced the stale React 18/CSS Modules/Context, Docker, hard-coded database credential and completed-payment claims.
- Documented current run commands, environment setup, verified stack, implemented areas, limitations, relevant documentation and security cautions.
- Explicitly separated v2 design intent from implemented functionality.
- Independent review found and corrected incomplete Firebase Phone OTP setup
  guidance, an inaccurate API-base-url fallback claim, and reliance on a v2
  document with broken internal links. The README now documents the untracked
  local Firebase service-account requirement and links directly to the current
  requirements/flow documents.

## Rejected claims

- Did not claim a live payment provider, IPN/webhook, Docker Compose setup, production readiness, full real booking/loyalty integration, Google sign-in, frontend automated tests, or backend behavioural tests.

## Files

- `README.md`
- `PROGRESS.md`
- `docs/ai-logs/m1/2026-07-21-readme-refactor-update.md`
