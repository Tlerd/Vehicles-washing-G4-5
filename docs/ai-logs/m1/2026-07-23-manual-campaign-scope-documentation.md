# Manual Campaign Scope Documentation

## Task

Record the approved clarification that FR-013 remains a manual campaign and
promotion capability rather than an AI campaign-management feature.

## User-approved scope

FR-013 remains in scope as administrator-managed campaign/promotion CRUD with
a loyalty point multiplier. Its existing administrator authorization,
target-tier, active-period, and audit requirements remain unchanged.

## Files changed

- `docs/srs/FR-013-ai-campaign-promotion-builder.md` →
  `docs/srs/FR-013-campaign-promotion-builder.md` — renamed the active FR-013
  requirement without changing its manual campaign requirements.
- `docs/srs/functional_requirements.md` — updated the FR-013 index link to the
  renamed requirement.
- `docs/plans/00-QUYET-DINH-REFACTOR.md` — clarified D-28 as manual
  administrator campaign CRUD with a point multiplier.
- `docs/superpowers/specs/2026-07-21-customer-fe-rebuild-design.md` — replaced
  legacy non-AI wording with the explicit manual administrator campaign scope.
- `PROGRESS.md` — only lines 4–7 are in scope for this clarification; later
  `PROGRESS.md` changes are pre-existing and unrelated, so any future staging
  must use hunk staging.
- `docs/ai-logs/m1/2026-07-23-manual-campaign-scope-documentation.md` — this
  evidence record.

## Historical evidence preserved

No dated AI log, evidence report, migration filename, or other historical
record was edited or removed.

## Validation

- Read the approved manual-campaign scope design and implementation plan.
- Confirmed the active FR-013 specification retains manual campaign CRUD,
  administrator authorization, point multiplier, target tier, active period,
  and `403 Forbidden` acceptance criteria.
- `git diff --check` exited 0.
- Active link and file searches passed: the SRS index resolves to
  `FR-013-campaign-promotion-builder.md`, the renamed requirement exists, and
  no active SRS index link points to the former filename.
- forbidden-label searches passed: active scope documents contain no obsolete
  AI campaign-management claim; the approved design and plan retain their
  historical-label discussion solely to define the documentation change.
- Confirmed no scoped changes under `Back-end/`, `Front-end/`, `database/`, or
  test paths.
- Confirmed dated historical AI logs and reports are unchanged.
- Inspected the working tree before editing to preserve unrelated changes.

## Decisions

- Accepted: documentation-only clarification of the approved manual FR-013
  scope.
- Rejected: deletion of application source, API routes, database artifacts, or
  UI features.
