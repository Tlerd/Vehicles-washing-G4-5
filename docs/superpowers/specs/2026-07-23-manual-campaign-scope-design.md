# Manual Campaign Scope Documentation Design

## Goal

Remove the obsolete **AI campaign-management** label from the active AutoWash
Pro documentation while retaining FR-013 as a manual, administrator-managed
campaign and loyalty point-multiplier capability.

## Scope decision

FR-013 remains in the approved v2 scope. It covers manual campaign CRUD,
administrator authorization, tier/date eligibility, campaign point multipliers,
and audit requirements. It does not include AI generation, recommendation,
automation, or other AI campaign-management behavior.

## Documentation changes

1. Rename the active FR detail file from
   `FR-013-ai-campaign-promotion-builder.md` to
   `FR-013-campaign-promotion-builder.md`, without changing its manual
   campaign requirements.
2. Update active SRS indexes, decision documents, current plans, and test
   guides to use the renamed FR title and link.
3. Update current onboarding/reference wording only where it describes the
   product scope as AI-managed. Existing source inventory may continue to
   describe the legacy `Promotion` implementation factually.
4. Preserve dated AI logs, evidence reports, migration filenames, and other
   historical records. They document past decisions and are not rewritten.
5. Add a dated scope entry to `PROGRESS.md` and an English AI log that record
   this documentation-only clarification. No application source, database
   migration, API route, or UI feature is removed.

## File boundary

Likely active-document edits are limited to:

- `docs/srs/functional_requirements.md`
- `docs/srs/FR-013-campaign-promotion-builder.md` (renamed from the current
  file)
- `docs/plans/00-QUYET-DINH-REFACTOR.md`
- `docs/testing/RUN-AND-TEST-FR001-FR013.md`
- `docs/testing/RUN-FULL-FR001-FR013.md`
- `docs/superpowers/specs/2026-07-21-customer-fe-rebuild-design.md`
- `PROGRESS.md`
- `docs/ai-logs/m1/2026-07-23-manual-campaign-scope-documentation.md`

The loyalty formula, `K_km` campaign multiplier, FR-006 coupling, campaign
API requirements, and FR-013 effort remain unchanged because manual campaign
promotions remain in scope.

## Verification

Verify that active documentation has no AI campaign-management claim, every
FR-013 link resolves to the renamed file, the manual multiplier requirements
remain present, no historical evidence was changed, and the working-tree diff
contains documentation only.
