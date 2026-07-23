# Antigravity Skill Repository Parity

## Task

Make the skill repositories already installed for Claude Code and Codex
available to Antigravity CLI in this repository.

## Configuration

Antigravity uses the repository-local `.agents/skills` convention. Existing
project skill directories were retained. The installed skill directories from
the local plugin caches were copied into that same canonical directory,
including their supporting files:

- `multica-ai/andrej-karpathy-skills` — existing `karpathy-guidelines`.
- `affaan-m/ECC` — existing adopted ECC skills: `api-design`, `e2e-testing`,
  `frontend-patterns`, `jpa-patterns`, and `security-review`.
- `obra/superpowers` — 14 skills copied from installed version `6.1.1`.
- `Gentleman-Programming/engram` — `memory` skill copied from installed
  version `0.1.1`.
- `Egonex-AI/Understand-Anything` — 9 skills copied from installed version
  `2.9.4`.
- `mattpocock/skills` — existing `codebase-design` and `diagnosing-bugs`.

No `.agent` legacy directory was created. `.agents/skills` remains the only
workspace skill source.

## Verification

- `agy --help` confirms the Antigravity CLI is installed.
- All 14 Superpowers, 1 Engram, and 9 Understand-Anything source skill
  directories are present under `.agents/skills`.
- The final workspace contains 32 skill directories and 32 `SKILL.md` files.
- `git diff --check` completed without whitespace errors.
- No application build or test was run because this was a tooling-only change.

## Human validation

Start a fresh Antigravity CLI session in the repository and verify that the
skills are discoverable. The copied files are project-local snapshots of the
installed versions; update them deliberately when the source plugins are
upgraded.

## Files

- `.agents/skills/` — Antigravity/Codex workspace skill inventory.
- `PROGRESS.md` — progress entry.
