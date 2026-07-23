# Manual Campaign Scope Documentation Implementation Plan

**Goal:** Update active documentation so FR-013 specifies manual administrator campaign and promotion management, with no AI campaign-management claim.

**Architecture:** Documentation-only rename and wording normalization. FR-013 retains manual CRUD, administrator authorization, tier/date eligibility, and point multipliers. Historical records stay unchanged.

## Constraints

- Do not change application source, API, database, migrations, or tests.
- Keep FR-013, its four-day estimate, `K_km`, and the manual campaign API requirement.
- Preserve dated logs, milestone reports, migration names, and unrelated worktree changes.

### Task 1: Rename the active FR specification

Files: rename `docs/srs/FR-013-ai-campaign-promotion-builder.md` to `docs/srs/FR-013-campaign-promotion-builder.md`; update `docs/srs/functional_requirements.md`.

- [ ] Rename the file without changing manual campaign requirements.
- [ ] Change the SRS link to `FR-013-campaign-promotion-builder.md`.
- [ ] Verify the renamed file retains admin CRUD, multiplier, target tier, active period, and 403 acceptance criteria.

### Task 2: Normalize active scope language

Files: `docs/plans/00-QUYET-DINH-REFACTOR.md`; `docs/superpowers/specs/2026-07-21-customer-fe-rebuild-design.md`.

- [ ] Reword D-28 as manual administrator campaign CRUD plus a point multiplier; retain D-28 and its affected-document references.
- [ ] Replace “minus the AI” and “non-AI” with “manual administrator campaign CRUD”. Retain the separate admin/counter portal boundary.
- [ ] Search active scope documents for AI campaign labels and confirm no active claim remains.

### Task 3: Record the approved scope clarification

Files: `PROGRESS.md`; create `docs/ai-logs/m1/2026-07-23-manual-campaign-scope-documentation.md`.

- [ ] Add a dated progress entry stating manual campaign CRUD and multiplier remain in scope, no application component was removed, and historical evidence was preserved.
- [ ] Create an English AI log with task, approved scope, changed files, preserved history, accepted/rejected changes, and validation evidence.

### Task 4: Verify scope and cross references

- [ ] Confirm `functional_requirements.md` links only to the renamed FR-013 file.
- [ ] Confirm `docs/testing/RUN-AND-TEST-FR001-FR013.md` retains its already-manual campaign verification row.
- [ ] Run `rg` for AI campaign labels across active docs; permit the new design spec’s historical rename statement only.
- [ ] Run `git diff --check`, inspect `git diff --name-only`, and confirm no changed paths under Back-end, Front-end, or database.
- [ ] Confirm no diff under dated AI logs or `docs/reports/milestone/REFACTOR-REPORT.md`.

### Task 5: Commit after human diff review

- [ ] Stage only the scoped documentation files after the human owner confirms unrelated pre-existing changes are excluded.
- [ ] Commit message: `docs: clarify manual campaign promotion scope`.
