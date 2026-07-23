# AutoWash Pro AI Harness

## Status

Core repository structure is provisioned. This is not a claim that runtime
discovery, builds, tests, security review, vendor approval, or human approval
has passed.

## Canonical sources

- ai/catalog/agents contains the canonical repository agent inventory.
- ai/vendor/ecc is an immutable local adoption of the current Claude ECC assets.
- ai/manifest.json describes the managed agent/skill inventory and runtime
  adapters.
- ai/lock/vendors.lock.json records hashes for the adopted ECC inventory.
- ai/state/managed-files.json owns the original generated adapters and skill
  mirrors. `scripts/ai-harness/verify-antigravity-sync.ps1` verifies the
  Antigravity-specific adapters and current shared-context parity.
- `.agents/agents/` and `.agents/rules/` are Antigravity runtime adapters;
  their canonical sources remain `ai/catalog/agents/` and the project rules.
- Run `scripts/ai-harness/Sync-AntigravityAdapters.ps1` after changing the
  canonical agent catalog or project source-priority rule, then run
  `scripts/ai-harness/verify-antigravity-sync.ps1`.
- `AGENTS.md` is the shared context entrypoint. Antigravity does not
  automatically load `ai/`, so the entrypoint and the adapter rules explicitly
  direct it to the relevant inventory and workflow files.

## Deferred decisions

- D-001: Superpowers remains the repository workflow owner. The official Codex
  and Claude plugin installers were attempted on 2026-07-21 but this managed
  runtime denied writes to their user-level caches. No plugin was installed and
  no repository settings were changed. Retry from the developer's normal
  terminal with `codex plugin add superpowers@openai-curated`; if Claude Code is
  also required, run `claude plugin install superpowers@claude-plugins-official
  --scope project`.
- D-002: /codex:review and /codex:adversarial-review still need runtime
  availability confirmation in Claude.
- D-003: ECC adoption is pending human vendor review.
- D-004: Existing Claude ECC rules and skills were preserved, not overwritten.

Run the checks in docs/tooling/AI-HARNESS-SETUP_v1.md before changing this
harness. Root AGENTS.md remains authoritative.
