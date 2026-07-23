# Antigravity Shared Context Design

**Date:** 2026-07-23

## Goal

Make Antigravity understand the same repository policy, agent inventory,
workflow ownership, skill layer, and project handoff state used by Claude Code
and Codex, while retaining one canonical source for each kind of information.

## Design

`AGENTS.md` is the cross-runtime entrypoint. It explicitly tells every agent to
read `PROGRESS.md`, approved requirements/design documents, and the relevant
files under `ai/` before work. The `ai/` directory remains the source of truth
for the agent catalog, workflow definitions, vendor metadata, and managed-file
inventory; it is not duplicated as a second runtime instruction tree.

Antigravity-specific discovery adapters live under `.agents/`:

- `.agents/skills/` contains runtime skills and supporting files.
- `.agents/agents/<name>/agent.md` wraps `ai/catalog/agents/<name>.md` in the
  YAML frontmatter required by Antigravity's workspace custom-agent layout.
- `.agents/rules/` contains the project source-priority rule and a short rule
  that points Antigravity to the shared context and workflow files.

The adapters are generated snapshots, not competing sources. A verifier under
`scripts/ai-harness/` compares the Antigravity agent/rule adapters with their
canonical sources and reports drift. Existing Claude and Codex adapters are
preserved.

## Boundaries

- Do not copy `ai/manifest.json`, `ai/state`, or `ai/lock` into `.agents/`.
- Do not replace `AGENTS.md`, `PROGRESS.md`, approved requirements, or design
  documents with generated summaries.
- Do not add a second `.agent/` legacy directory.
- Do not change application source, dependencies, or runtime behavior.

## Success criteria

1. A fresh Antigravity session sees workspace skills under `.agents/skills`.
2. `/agents` can discover every catalog role through `.agents/agents`.
3. Antigravity's workspace rules direct it to the same `AGENTS.md`,
   `PROGRESS.md`, `ai/`, and approved-document sources as Claude/Codex.
4. The verifier passes with zero missing or drifted agent/rule adapters.
5. Existing Claude/Codex paths remain intact.
