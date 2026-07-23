# Shared project context

Before meaningful work, read these in order:

1. `AGENTS.md` for repository policy and source priority.
2. `PROGRESS.md` for current state, decisions, blockers, and next action.
3. The relevant approved requirements and design documents.
4. `ai/manifest.json` and the relevant role in `ai/catalog/agents/`.
5. The applicable procedure in `ai/workflows/`.
6. Affected source files and executable tests.

The `ai/` directory is the canonical project inventory and workflow source. The
`.agents/agents/`, `.agents/rules/`, and `.agents/skills/` directories are
Antigravity runtime adapters. Run
`scripts/ai-harness/verify-antigravity-sync.ps1` before relying on adapter
parity. Preserve unrelated user changes.
