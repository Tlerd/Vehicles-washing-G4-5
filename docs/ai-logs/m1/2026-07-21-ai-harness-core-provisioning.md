# AI-Assisted Work Log — Core AI Harness Provisioning

- Date: 2026-07-21
- Milestone: m1 placeholder; move when the team confirms the milestone
- Human validation: PENDING
- Commit: none created by this task

## Task

Use docs/tooling/AI-HARNESS-SETUP_v1.md to migrate the existing local Claude
ECC assets into a safe core repository harness and configure the native Claude
and Codex adapter structure.

## Scope

Core harness provisioning only. The task created canonical local inventory,
native read-only agent adapters, a Codex skill mirror, a manifest, a vendor
lock, a managed-file ledger, and a read-only verifier. It did not replace
AGENTS.md, CLAUDE.md, PROGRESS.md, .claude/settings.json, existing Claude ECC
rules, or existing Claude skills.

## Inputs inspected

- docs/tooling/AI-HARNESS-SETUP_v1.md
- AGENTS.md, CLAUDE.md, PROGRESS.md, and .claude/settings.json
- docs/tooling/BASELINE.md and docs/tooling/UPSTREAM-VERSIONS.md
- Existing .claude/rules/ecc and .claude/skills
- Current Git status including untracked files
- Current Codex and Claude CLI versions

## Applied changes

- Created ai/ as the canonical harness source and state directory.
- Adopted the existing local ECC inventory into ai/vendor/ecc without changing
  the existing Claude source paths:
  - 21 ECC rule files
  - 5 skills: api-design, e2e-testing, frontend-patterns, jpa-patterns, and
    security-review
  - 1 companion skill file for security-review
  - the existing ECC license text
- Created .agents/skills as a byte-for-byte Codex mirror of the five existing
  Claude skills.
- Created .codex/config.toml and two standalone read-only custom agents:
  planner and code-reviewer.
- Created matching Claude project agents under .claude/agents.
- Created .claude/rules/project/source-priority.md to state that root
  AGENTS.md overrides vendored ECC guidance.
- Created ai/manifest.json, ai/schema/manifest.schema.json,
  ai/lock/vendors.lock.json, and ai/state/managed-files.json.
- Created scripts/ai-harness/Test-AiHarness.ps1 as a read-only structural
  verifier requiring PowerShell 7 or newer.

## Accepted decisions

- Existing Claude ECC assets were adopted locally and preserved in place.
- Only new, create-only paths were used for this provisioning.
- ECC is recorded as adopted-local-pending-human-review, not approved.
- Superpowers remains the workflow owner from AGENTS.md but was not installed
  as a plugin and no vendor snapshot was fetched or pinned.
- The two new agents are read-only and do not implement code changes.

## Rejected changes

- No overwrite or normalization of AGENTS.md, CLAUDE.md, PROGRESS.md, or
  .claude/settings.json.
- No deletion or replacement of existing .claude/rules/ecc or
  .claude/skills content.
- No plugin installation, network vendor fetch, model invocation, commit,
  push, broad Git staging, build, test, secret rotation, or security claim.

## Verification evidence

A staged create-only candidate was validated before live files were written.
After apply, a read-only structural check reported:

- Manifest, schema, lock, and ledger JSON parsed successfully.
- Managed-file ledger entries: 13; every live SHA-256 matched, including the read-only verifier.
- Codex agent configuration: 2 adapters present with required fields.
- Claude agent configuration: 2 adapters present with required frontmatter.
- Skill inventory: 5 direct-child skills in .agents/skills.
- Skill parity: each canonical ECC skill matched both the Codex mirror and the
  preserved Claude source tree byte-for-byte.
- Rule parity: the 21 canonical ECC rule files matched the preserved Claude
  rule tree byte-for-byte.
- Codex CLI version observed: codex-cli 0.144.6.
- Claude CLI version observed: Claude Code 2.1.216.

## Not run

- Actual Codex and Claude runtime discovery or model smoke prompts: NOT RUN.
- Native PowerShell 7 verifier execution: NOT RUN; the available pwsh spawn
  was denied by the current execution runner.
- Windows PowerShell verifier execution: NOT RUN as a valid result;
  PowerShell 5.1 correctly rejected the script's PowerShell 7 requirement.
- Frontend dependency installation/build and backend Maven tests: NOT RUN.
- Vendor retrieval, Superpowers installation, ECC human review, security
  review, secret rotation, and human acceptance: NOT RUN.

## Deferred decisions and blockers

- D-001: choose a reviewed Superpowers delivery method and exact version or
  commit before adding it to the harness.
- D-002: verify /codex:review and /codex:adversarial-review availability in
  the active Claude environment.
- D-003: complete a human review of the adopted ECC content before marking it
  approved.
- D-004: decide whether any existing Claude asset should later become a
  managed replacement rather than a preserved adopted source.

## Related files

- ai/README.md
- ai/manifest.json
- ai/lock/vendors.lock.json
- ai/state/managed-files.json
- .codex/config.toml
- .codex/agents/planner.toml
- .codex/agents/code-reviewer.toml
- .claude/agents/planner.md
- .claude/agents/code-reviewer.md
- .claude/rules/project/source-priority.md
- .agents/skills/
- scripts/ai-harness/Test-AiHarness.ps1
- docs/ai-logs/m1/2026-07-21-ai-harness-core-provisioning.md
- PROGRESS.md
