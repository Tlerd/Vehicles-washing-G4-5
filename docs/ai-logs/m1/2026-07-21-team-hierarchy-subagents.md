# AI Log — Team Hierarchy Sub-agents

## Task

Create a frontend, backend, and testing sub-agent hierarchy, with specialist
children under frontend and backend leads.

## Accepted changes

- Added `frontend-lead` with UI, state, and quality specialists.
- Added `backend-lead` with API, data, and security specialists.
- Added `testing-lead` with unit and integration specialists; it also dispatches
  the existing `e2e-runner`.
- Added matching Codex and Claude Code adapters and manifest/ledger entries.
- Increased Codex `agents.max_depth` from 1 to 2, allowing root → lead →
  specialist delegation without a deeper tree.
- Added `ai/workflows/team-hierarchy.md` and shared policy in `AGENTS.md`.

## Validation evidence

- `pwsh -NoProfile -File scripts/ai-harness/Test-AiHarness.ps1`
  - Exit code: 0; `STRUCTURAL: PASS`.
- Manifest inventory: 22 agents; 22 Claude adapters; 22 Codex adapters.

## Limits and human validation

All roles are read-only evidence roles; the root agent performs writes. Claude
and Codex runtime discovery remain separate. Codex nested-agent runtime is
still BLOCKED by the existing Windows sandbox-helper issue. Human validation is
PENDING.
