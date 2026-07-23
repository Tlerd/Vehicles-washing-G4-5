# Claude/Codex Skill Parity

## Task

Make the adopted AI repositories usable across both Claude Code and Codex for the AutoWash Pro project.

## Human request

The user asked whether Karpathy skills work with Codex and requested synchronization for the remaining adopted repositories.

## Evidence checked

- `codex plugin list` verified Codex Superpowers and Engram are installed and enabled.
- `claude plugin list --json` verified Claude Superpowers, Engram, and Understand-Anything are installed and enabled for this project/user scope.
- The Karpathy upstream repository exposes `skills/karpathy-guidelines/SKILL.md`; it is compatible with Codex skill discovery when placed under `.agents/skills`.
- Understand-Anything's official `install.ps1 codex` completed successfully and created junctions under `C:\Users\nguye\.agents\skills`.
- Existing ECC skill adapters were already present under both `.agents/skills` and `.claude/skills`.

## Changes accepted

- Added project-local `karpathy-guidelines` skills for both runtimes.
- Added project-local `codebase-design` and `diagnosing-bugs` adapters for both runtimes, corresponding to the two previously installed Matt Pocock skills.
- Installed Understand-Anything for Codex with the upstream installer. Claude remains covered by the enabled project plugin.
- Updated `ai/manifest.json` with sources, outputs, and runtime status.

## Changes rejected

- No full repository copies were vendored for Karpathy, Matt Pocock, or Understand-Anything.
- No existing Claude plugin was replaced or downgraded.
- No secrets or credential files were changed.

## Runtime notes

- Restart Codex to discover the newly installed Understand-Anything junctions.
- Invoke Understand-Anything in Codex with `$understand`.
- The existing `CLAUDE.md` Karpathy import remains preserved; the project-local skill supplies the same guidance to Codex and makes the Claude/Codex skill inventory explicit.

## Human validation required

- Start a fresh Claude Code session and confirm `karpathy-guidelines`, `codebase-design`, and `diagnosing-bugs` are discoverable.
- Start a fresh Codex session and confirm those three skills plus `$understand` are discoverable.
