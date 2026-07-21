# AI Log — Sub-agent Workflow Definition

## Task

Define a reusable project workflow for the existing Codex and Claude Code
sub-agent roles.

## Accepted changes

- Added planning, implementation, verification, and review workflow definitions
  under `ai/workflows/`.
- Each workflow states the role-dispatch order, parallelization points, evidence
  expected from the lead agent, and repository safety limits.
- Linked the shared workflow definitions from `AGENTS.md`, which Claude Code
  imports through `CLAUDE.md` and Codex reads as project instructions.

## Rejected changes

- No new runtime agent was added because the existing 11 roles cover the
  required workflow responsibilities. A nested coordinator agent would be
  incompatible with the current Codex `max_depth = 1` setting and could prevent
  rather than guarantee direct role dispatch.
- No application source, build configuration, user settings, or credentials was
  changed.

## Validation evidence

- Confirmed the workflow files exist and contain all four lifecycle stages.
- Runtime dispatch remains separately tracked: Claude planner smoke test passed;
  Codex child-agent smoke test remains BLOCKED by the Windows sandbox-helper
  installation issue recorded in the prior orchestration log.

## Human validation

PENDING.
