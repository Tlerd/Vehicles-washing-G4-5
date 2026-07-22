# AI Log — Role Orchestration Inventory

## Task

Create all roles listed in `ai/vendor/ecc/rules/common/agents.md` for the
repository's Codex and Claude Code adapters, and require applicable sub-agent
dispatch for non-trivial work.

## Accepted changes

- Added the nine missing canonical role definitions: architect, tdd-guide,
  security-reviewer, build-error-resolver, e2e-runner, refactor-cleaner,
  doc-updater, rust-reviewer, and harmonyos-app-resolver.
- Added matching project adapters under `.claude/agents/` and `.codex/agents/`.
  Together with existing planner and code-reviewer adapters, the inventory has
  11 roles for each runtime.
- Added an explicit mandatory-dispatch policy and trigger matrix to `AGENTS.md`.
  `CLAUDE.md` explicitly inherits that policy.
- Extended the manifest and verifier so every manifest-listed role is checked
  for both runtime adapters, and recorded the resulting SHA-256 values in the
  managed-file ledger.

## Rejected changes

- No application source, build configuration, user settings, secrets, or
  vendored ECC source was changed.
- No role is permitted to edit files. Roles provide independent planning,
  diagnosis, review, or validation evidence; the lead agent integrates results
  and remains responsible for writes.

## Validation evidence

- `pwsh -NoProfile -File scripts/ai-harness/Test-AiHarness.ps1`
  - Exit code: 0
  - Result: `STRUCTURAL: PASS`
  - Scope: manifest-listed agent outputs and ledger hashes. Runtime discovery,
    builds, tests, security review, and human approval remain separate.
- `claude --agent planner --permission-mode plan --print "Read AGENTS.md and
  PROGRESS.md. Return only the title of a plan for this repository. Do not edit
  files."`
  - Exit code: 0
  - Result: `Rubric-Grounded Requirements Baseline and Security-Blocker
    Remediation for AutoWash Pro`
  - Interpretation: Claude Code loaded and exercised the project `planner`
    agent in plan mode.
- `codex exec --sandbox read-only "Follow AGENTS.md. This is a harmless
  orchestration smoke test: dispatch the planner subagent ..."`
  - Exit code: 0, but not a pass.
  - Codex stated it would delegate, then reported that the Windows sandbox
    helper `codex-windows-sandbox-setup.exe` could not be found. There is no
    evidence that the child planner completed, so Codex runtime validation is
    BLOCKED.

## Human validation

PENDING. No human approval, runtime repair, build, test, or security claim is
made by this log.

## Related files

`AGENTS.md`, `CLAUDE.md`, `ai/catalog/agents/`, `.claude/agents/`,
`.codex/agents/`, `ai/manifest.json`, `ai/state/managed-files.json`,
`scripts/ai-harness/Test-AiHarness.ps1`, and
`docs/tooling/AI-HARNESS-SETUP_v1.md`.
