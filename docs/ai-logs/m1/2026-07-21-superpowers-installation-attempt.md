# Superpowers installation attempt — 2026-07-21

## Task

Complete D-001 by installing Superpowers for the AutoWash Pro repository harness.

## Human authorization

The user requested that Superpowers installation be resumed and completed.

## Observed evidence

- Upstream documentation identifies the official Claude plugin as
  `superpowers@claude-plugins-official`.
- Codex CLI 0.144.6 listed `superpowers@openai-curated` as available from
  the configured official marketplace.
- The upstream Superpowers manifest observed on 2026-07-21 reports version
  6.1.1 and the MIT license.
- Claude install attempts with both `--scope project` and `--scope local`
  failed before installation because the managed runtime denied creation of
  `C:\\Users\\nguye\\.claude\\plugins\\cache\\...`.
- Codex install attempt `codex plugin add superpowers@openai-curated --json`
  failed before installation because the managed runtime denied creation of
  `C:\\Users\\nguye\\.codex\\plugins\\cache\\...`.
- The SHA-256 of `.claude/settings.json` was unchanged across the Claude
  installation attempts. No repository setting was changed by the failed
  installers.

## Accepted changes

- Recorded the official plugin identifiers, observed upstream version, exact
  failure class, and retry decision in `ai/manifest.json`,
  `ai/lock/vendors.lock.json`, and `ai/README.md`.

## Rejected changes

- No plugin snapshot was copied or marked installed.
- No user-home cache, marketplace configuration, or repository Claude settings
  were edited manually.
- No build, test, runtime model smoke test, or PowerShell harness verifier ran.

## Human validation needed

Run the following from the developer's normal terminal, where the user-level
Codex cache is writable:

```powershell
codex plugin add superpowers@openai-curated
codex plugin list
```

If Claude Code support is also required:

```powershell
claude plugin install superpowers@claude-plugins-official --scope project
claude plugin list --json
```

Then update the Superpowers entry in the vendor lock with the installed version
and evidence. No commit was created.
