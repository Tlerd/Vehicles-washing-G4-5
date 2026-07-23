# Antigravity CLI Skill Path Configuration

## Task

Configure the repository's installed project skills for Antigravity CLI using
the current documented workspace convention.

## Decision

The canonical project skill path is `.agents/skills`. The temporary
`.agent/skills` compatibility junction was removed so the repository has one
unambiguous skill source and follows the current Antigravity documentation.

## Evidence

- `agy.exe` is installed and responds to `agy --help`.
- `Test-Path .agents/skills` confirms the canonical project path exists.
- `.agents/skills` contains eight project skill directories:
  `api-design`, `codebase-design`, `diagnosing-bugs`, `e2e-testing`,
  `frontend-patterns`, `jpa-patterns`, `karpathy-guidelines`, and
  `security-review`.
- No application build or test was run because this was a tooling-path-only
  change.

## Human validation

The repository owner should start a fresh Antigravity CLI session in this
workspace and confirm that the project skills are available.

## Files

- `.agents/skills` — canonical skill source for Antigravity CLI and Codex.
- `PROGRESS.md` — progress entry.
