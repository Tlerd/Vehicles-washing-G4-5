# Engram local project configuration

## Task and scope

Configure the AutoWash Pro repository for deterministic local Engram project
memory after the owner installed the Codex and Claude Code integrations. This
work is limited to project identification; it does not enable cloud sync, Git
sync, HTTP serving, exports, or any application feature.

## Applied change

- Added `.engram/config.json` with `project_name: "autowash-pro"`.
- The configuration gives Engram's project detection a stable, repository-local
  default when an MCP client is launched from this repository or a subdirectory.

## Evidence

- `C:\\Users\\nguye\\go\\bin\\engram.exe version` reported `engram 1.20.0`.
- `C:\\Users\\nguye\\go\\bin\\engram.exe doctor --json` returned status `ok`
  with 4 checks OK and no warnings, blocks, or errors.
- The existing Codex MCP configuration at
  `%APPDATA%\\codex\\config.toml` uses the explicit executable path
  `C:\\Users\\nguye\\go\\bin\\engram.exe` with `mcp --tools=agent`; the
  current shell not having that directory on `PATH` therefore does not prevent
  Codex from launching it.
- Before the change, no repository `.engram/` directory existed; the new
  configuration is not ignored by Git.

## Decisions and limits

- Engram is auxiliary memory only. `PROGRESS.md`, approved requirements, and
  AI logs remain the project evidence and source-of-truth record.
- Cloud sync, Git sync, export, and local HTTP serving were not configured or
  run.
- No `.gitignore` entry was added: no repository-local mutable Engram artifact
  was observed, and ignoring `.engram/` would also hide the tracked project
  configuration.
- If Git sync is ever approved, review its generated `.engram/` chunks before
  staging them. Do not run `engram sync` or use broad staging such as `git add
  .` for this directory without an approved sharing and sensitive-data policy.
- Do not store passwords, password hashes, JWTs, API keys, Firebase/service
  credentials, payment data, customer PII, or raw production errors in Engram.

## Human validation pending

Start a fresh Codex or Claude Code session in the repository and call
`mem_current_project`. It should report `autowash-pro`; this log does not claim
that fresh-session MCP validation has occurred yet.

## Related files

- `.engram/config.json`
- `PROGRESS.md`
