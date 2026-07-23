# Antigravity Shared Project Context

## Task

Configure Antigravity to understand the same repository policy, agent
inventory, workflow ownership, skills, and progress handoff used by Claude Code
and Codex.

## Accepted design

- `AGENTS.md` is the runtime-neutral entrypoint.
- `ai/` remains the canonical source for the agent catalog, workflow
  definitions, vendor metadata, manifest, and managed-file inventory.
- `.agents/skills/` is the canonical Antigravity/Codex workspace skill path.
- `.agents/agents/<name>/agent.md` is the Antigravity workspace adapter for
  each role in `ai/catalog/agents/`. Each adapter adds only the YAML
  frontmatter required by Antigravity; its instruction body is generated from
  the catalog source.
- `.agents/rules/` contains Antigravity workspace rules that direct the agent
  back to `AGENTS.md`, `PROGRESS.md`, approved documents, and `ai/`.
- No legacy `.agent/` directory is used.

## Changes

- Updated `AGENTS.md` with the shared context reading order and adapter
  regeneration/verification commands.
- Updated `ai/README.md` and `ai/manifest.json` to document Antigravity's
  adapter destinations.
- Added 22 agent adapters under `.agents/agents/`.
- Added `.agents/rules/project/source-priority.md` and
  `.agents/rules/project/shared-context.md`.
- Added `scripts/ai-harness/Sync-AntigravityAdapters.ps1` to regenerate the
  generated agent/rule adapters from canonical sources.
- Added `scripts/ai-harness/verify-antigravity-sync.ps1` to detect missing or
  drifted adapters, missing manifest skill outputs, and reintroduction of
  `.agent/`.
- Added the approved design and implementation plan under
  `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## Verification evidence

Commands run from the repository root:

```text
& .\scripts\ai-harness\Sync-AntigravityAdapters.ps1
Antigravity adapters synchronized: agents=22, rules=1

& .\scripts\ai-harness\verify-antigravity-sync.ps1
Antigravity sync OK: catalog_agents=22, agent_adapters=22, manifest_skill_outputs=8, workspace_skills=32

git diff --check
exit code 0 (only Git line-ending warnings for existing text files)
```

The existing `scripts/ai-harness/Test-AiHarness.ps1` was also run. It failed
before broader validation at the pre-existing managed ledger mismatch for
`.codex/config.toml`. That file was not modified as part of this task.

`agy agents` did not print workspace agents in its non-interactive listing,
so fresh-session `/agents` discovery remains a human runtime validation step;
the workspace files follow the documented `.agents/agents/<name>/agent.md`
layout.

## Human validation

Start a fresh Antigravity session in the repository and use `/agents` to check
the custom roles. Ask it to summarize the project handoff using `AGENTS.md`,
`PROGRESS.md`, and `ai/` to confirm the shared-context path. If the catalog or
project rules change, run the sync script and then the verifier.
