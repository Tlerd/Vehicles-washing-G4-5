# Local backend startup environment loader — 2026-07-22

## Task

Record and document the observed local backend startup failure, then provide a
safe manual startup command that does not expose or persist secret values.

## Evidence

- The owner ran `./Back-end/run-local.ps1`. Maven compiled the project, but
  Spring Boot stopped during bean creation with `Could not resolve placeholder
  'JWT_SECRET'`.
- A masked inspection of `Back-end/.env` confirmed both `DB_PASSWORD` and
  `JWT_SECRET` were populated; no values were printed or added to a tracked
  file.
- A PowerShell command that reads `Back-end/.env`, ignores comments, splits
  each assignment only at its first `=`, and writes nonblank values into the
  current process environment before `mvn spring-boot:run` started the backend.
- `GET http://localhost:8080/api/v1/branches` returned HTTP 200 after that
  manual startup.

## Accepted changes

- Updated `README.md` with the verified same-terminal PowerShell loader and
  `mvn spring-boot:run` command.
- Clarified that `.env` is configuration data, not an executable command.
- Corrected the README's stale statement that the frontend has no localhost
  API fallback.
- Updated `PROGRESS.md` with the observed state and next action.

## Rejected claims and limits

- No secret value, database password, JWT secret, token, or payment credential
  was logged or committed.
- `Back-end/run-local.ps1` was not claimed fixed. Its source intends to load
  environment values, but the observed startup did not receive `JWT_SECRET`;
  the effective propagation requires separate diagnosis.
- This was a local startup verification, not a backend test-suite, Swagger,
  frontend build, or browser E2E result.

## Human validation

The owner can run the README command in one PowerShell window and should see
Spring Boot's normal startup output before opening
`http://localhost:8080/api/v1/branches`.

## Files

- `README.md`
- `PROGRESS.md`
- `docs/ai-logs/m1/2026-07-22-local-backend-startup-env-loader.md`

No commit was created in this task.
