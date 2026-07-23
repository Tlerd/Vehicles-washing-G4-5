# Antigravity Shared Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Antigravity to use the repository's shared policy, progress, agent catalog, workflow references, and skill layer.

**Architecture:** Keep `AGENTS.md`, `PROGRESS.md`, approved documents, and `ai/` as canonical project context. Generate only the Antigravity discovery adapters under `.agents/agents` and `.agents/rules`, while `.agents/skills` remains the runtime skill source. A PowerShell verifier detects drift between canonical catalog/rules and adapters.

**Tech Stack:** Markdown agent/rule files, PowerShell 5+/7 verifier, existing Antigravity `.agents` conventions.

## Global Constraints

- Root `AGENTS.md` and the user's request have priority over generated or vendored guidance.
- `PROGRESS.md` is a handoff record, not requirements evidence.
- Existing `.claude`, `.codex`, `ai/vendor`, and application files remain intact.
- Antigravity workspace agents use `.agents/agents/<agent_name>/agent.md`.
- Antigravity workspace skills use `.agents/skills/<skill_name>/SKILL.md`.

---

### Task 1: Add shared Antigravity context rules

**Files:**
- Modify: `AGENTS.md`
- Modify: `ai/README.md`
- Create: `.agents/rules/project/source-priority.md`
- Create: `.agents/rules/project/shared-context.md`

- [x] Add an explicit runtime-neutral context-reading order and Antigravity adapter paths to `AGENTS.md`.
- [x] Correct `ai/README.md` so it describes the full catalog and the new Antigravity adapters without claiming `ai/` is automatically discovered.
- [x] Mirror the existing source-priority rule into `.agents/rules/project/source-priority.md`.
- [x] Add `.agents/rules/project/shared-context.md` with the required handoff and workflow references.
- [x] Run `git diff --check`.

### Task 2: Generate Antigravity custom agents

**Files:**
- Create: `.agents/agents/<catalog-agent>/agent.md` for every file in `ai/catalog/agents/`.

- [x] Wrap each catalog role in Antigravity-required YAML frontmatter and place it in the nested directory layout without changing its instructions body.
- [x] Verify the adapter count equals the catalog count.
- [x] Verify every adapter body, after removing generated frontmatter, matches its catalog source.

### Task 3: Add an adapter drift verifier

**Files:**
- Create: `scripts/ai-harness/verify-antigravity-sync.ps1`

- [x] Verify the repository root, canonical catalog, and Antigravity adapter directories.
- [x] Compare every catalog agent to its `.agents/agents/<name>/agent.md` adapter.
- [x] Compare canonical project rules to their `.agents/rules/project` adapters.
- [x] Exit nonzero with actionable missing/drifted paths; exit zero with counts when synchronized.

### Task 4: Validate and document the configuration

**Files:**
- Modify: `PROGRESS.md`
- Create: `docs/ai-logs/m1/2026-07-23-antigravity-shared-context.md`

- [x] Run the verifier and record its exact output.
- [x] Verify `.agents/skills`, `.agents/agents`, and `.agents/rules` contain no legacy `.agent` path.
- [x] Run `git diff --check`.
- [x] Record accepted boundaries, human fresh-session validation, and remaining runtime limitations.
