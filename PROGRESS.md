# Progress — AutoWash Pro

## Current state
- Milestone: VERIFY WITH THE LECTURER OR TEAM
- Status: Harness scaffolding created; security blockers still open
- Baseline commit: see docs/tooling/BASELINE.md
- Active scope: RECORD THE APPROVED REQUIREMENT OR TASK

## Verified repository facts
- Backend targets Java 17 and uses Spring Boot parent 3.5.6.
- Maven wrapper is not present.
- Frontend scripts currently available: dev, build, preview.
- Frontend test and lint scripts are not present.

## Decisions
- Superpowers owns the development workflow and TDD.
- ECC is vendored selectively for stack-specific guidance.
- Understand-Anything is for navigation, not requirements.
- Codex provides an independent review pass.

## Security blockers
- [ ] Firebase or service-account credential rotation has been confirmed by the
      cloud owner. Status is currently unverified.
- [ ] Plain sensitive assignments in application.properties have been replaced
      with environment-only placeholders, with deployment secrets configured
      outside Git.
- [ ] Other credential-like values exposed in repository history have been
      assessed and rotated where applicable.
- [ ] The team has recorded its decision about coordinated history rewriting.

## Next
1. Attach the original rubric and create only checklist entries supported by it.
2. Complete and record the security blockers above.
3. Run the real backend and frontend commands and preserve their output.
4. Generate and review the initial codebase graph if the team adopts
   Understand-Anything.

## Evidence
- Link command logs, reports, pull requests, commits, screenshots, or exports.
- Do not mark an item complete without evidence.
