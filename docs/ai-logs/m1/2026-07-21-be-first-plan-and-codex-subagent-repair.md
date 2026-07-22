# AI Log — BE-first Plan and Codex Sub-agent Repair

## Task

Record the owner-directed backend/API-and-Swagger-first delivery plan and repair
the local Codex custom-subagent runtime. No business application implementation
was requested.

## Accepted changes

- Added the active backend-first plan at
  `docs/superpowers/specs/2026-07-21-be-first-api-swagger-plan.md`.
- Marked the prior FR-004 incremental frontend-wiring plan as superseded while
  retaining it as historical audit evidence.
- Updated `PROGRESS.md` and `ai/manifest.json` to replace the stale
  “Codex planner runtime blocked” claim with the observed limited runtime
  result.
- Repaired the local Codex 0.144.6 Windows launcher installation by copying
  the matching official `codex-command-runner.exe` and
  `codex-windows-sandbox-setup.exe` from the installed standalone release’s
  `codex-resources` directory beside the launcher. SHA-256 values matched
  their source files before use.

## Runtime evidence

- `codex doctor` — exit 0; 17 OK, 1 idle, 0 warning, 0 failure.
- `codex exec --sandbox read-only "Reply with exactly: sandbox-smoke"` — exit
  0; returned `sandbox-smoke`.
- Initial custom-agent smoke test exposed the historical failure:
  `codex-windows-sandbox-setup.exe` could not be found. After locating the
  matching helper under the installed 0.144.6 standalone release, the first
  repair attempt then exposed `CreateProcessWithLogonW failed: 2` because the
  command-runner was likewise unavailable beside the launcher.
- Final read-only local CLI test explicitly requested project custom agent
  `planner`, displayed `collab: Wait`, returned `PLANNER_AGENT_OK`, exited 0,
  and emitted no sandbox or child-launch error.

## Limits

- The final smoke test verifies one direct `planner` child only. It does not
  prove discovery of every manifest adapter, nested lead-to-specialist dispatch,
  or human approval of the orchestration policy.
- No backend application code, schema migration, frontend file, build, API,
  Swagger endpoint, database, or test suite was changed or claimed complete.
- Historic AI logs retain their original observed “BLOCKED” results and are not
  rewritten.

## Related files

`PROGRESS.md`, `ai/manifest.json`,
`docs/superpowers/specs/2026-07-21-be-first-api-swagger-plan.md`, and
`docs/superpowers/specs/2026-07-21-fr004-real-booking-implementation-plan.md`.
