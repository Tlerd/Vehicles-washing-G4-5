# Local STAFF and ADMIN password rotation — 2026-07-22

## Task

Apply the owner's requested new password to the existing local STAFF and ADMIN
accounts without placing the password, a password hash, or database credentials
in a source file or log.

## Scope and safeguards

- Preflight SQL Server query confirmed exactly one `STAFF` row and one `ADMIN`
  row in `autowash_pro`.
- The mutation targeted the existing STAFF and ADMIN identities by both phone
  and role, never by role alone.
- Two fresh BCrypt hashes were generated locally with Spring Security's
  `BCryptPasswordEncoder`; neither hashes nor plaintext were printed.
- A parameterized SQL Server transaction set `password_hash` and
  `updated_at`. It required exactly one affected row for each target and would
  have rolled back on any mismatch.

## Evidence

- Transaction result: one STAFF row and one ADMIN row updated.
- Post-update database check confirmed two 60-character BCrypt-format hashes.
- Spring Security BCrypt `matches()` verification returned true for both
  stored hashes using the owner-supplied password.

## Limits and follow-up

- The backend was not started and no login HTTP request was performed in this
  rotation task; BCrypt verification is the recorded confirmation.
- JWTs are stateless in this application. Password rotation does not revoke
  already-issued JWTs; rotating `JWT_SECRET` would be a separate, broader
  action if session invalidation is required.
- No commit was created.

## Files

- `PROGRESS.md`
- `docs/ai-logs/m1/2026-07-22-local-staff-admin-password-rotation.md`
