# AI-Assisted Work Log — AI Harness Setup v1 Revision

- Date: 2026-07-21
- Milestone: m1 placeholder; move when the team confirms the milestone
- Human validation: PENDING
- Commit: none created by this task

## Task

Review the downloaded AI harness setup guide, correct known safety and
compatibility problems, and create a revised v1 file inside the AutoWash Pro
repository.

## Scope

Documentation and migration design only. The harness was not installed or
applied. Application source, runtime adapters, vendor snapshots, plugins,
personal settings, builds, tests, and security state were not changed.

## Inputs inspected

- C:\Users\nguye\Downloads\AI-HARNESS-SETUP_v1.md
  - SHA-256:
    FAAF5A08A280D939A7EA149175377B37B0B41B7DAE4939CB7E6BCBAD3D351219
- AGENTS.md
- CLAUDE.md
- PROGRESS.md
- docs/tooling/BASELINE.md
- docs/tooling/UPSTREAM-VERSIONS.md
- .gitignore
- .claude/settings.json
- Back-end/pom.xml
- Front-end/package.json
- Current .claude, .codex, .agents, .ua, docs/tooling, and harness-related
  directory inventory
- Current official Codex documentation for AGENTS.md, project configuration,
  custom subagents, and repository skills
- Current official Claude Code documentation for CLAUDE.md imports, custom
  subagents, skills, and settings

No credential value was copied into this log.

## Work performed

- Created docs/tooling/AI-HARNESS-SETUP_v1.md as a migration-safe runbook.
- Preserved AGENTS.md, CLAUDE.md, PROGRESS.md, and .claude/settings.json as
  human-owned inputs rather than generated outputs.
- Replaced whole-directory synchronization with a file-level manifest and
  managed-state contract.
- Replaced sequential vendor mutation with one candidate-first, journaled
  transaction model.
- Required full upstream commit pins, license and inventory checks, hashes, and
  a separate human approval state.
- Defined the current native Codex and Claude project layouts.
- Reduced v1 core scope to two completely specified read-only roles: planner and
  code-reviewer.
- Separated structural, dry-run, parity, runtime, build/test, security, and
  human-review claims.
- Added explicit dirty-worktree, path containment, reparse-point, collision,
  rollback, evidence, and exact-staging rules.
- Updated PROGRESS.md separately to record that the guide was revised but not
  applied.

## Accepted design changes

- Repository policy remains authoritative.
- Superpowers retains the workflow ownership already stated by AGENTS.md.
- ECC remains advisory.
- Runtime skills use the direct-child layouts
  .claude/skills/<skill-name>/SKILL.md and
  .agents/skills/<skill-name>/SKILL.md.
- Codex custom agents use standalone .codex/agents/*.toml files.
- Claude custom agents use .claude/agents/*.md with YAML frontmatter.
- Existing unrelated worktree changes are preserved.
- Apply requires a reviewed deterministic plan and unchanged fingerprints.
- Verification derives expected inventory from the manifest.

## Rejected design choices

- Replacing AGENTS.md, CLAUDE.md, PROGRESS.md, or .claude/settings.json from a
  template.
- Recursively deleting .claude/skills, .agents/skills, .claude/rules, or other
  runtime roots.
- Using mutable upstream HEAD as provenance.
- Marking fetched content approved before human review.
- Guessing between alternative upstream skill paths.
- Treating file existence as runtime verification.
- Treating zero executed tests as behavioral evidence.
- Broad automatic staging, committing, pushing, cleaning, stashing, or history
  rewriting.
- A smoke test that edits PROGRESS.md or creates a fictional task.

## Verification evidence

A read-only JavaScript validation pass inspected the created guide and reported:

- UTF-8 size: 37,601 bytes
- Line count: 1,017
- SHA-256:
  0a3e2efdbc8afd96db8869895bfeb10396d821f9907c723d2231abb424c26fe1
- Markdown fence markers: 36, balanced
- Fenced blocks:
  - PowerShell: 6
  - text: 6
  - TOML: 3
  - YAML: 2
  - JSON: 1
- JSON blocks parsed: 1 of 1
- TOML contract checks: 3 of 3
- YAML frontmatter contract checks: 2 of 2
- Required structure and safety markers: present
- Placeholder and literal newline-corruption scan: no findings
- Static validation failures: 0

A final independent read-only review found no Codex or Claude layout
contradiction. It identified and this revision corrected:

- per-operation destination and reparse revalidation for concurrent mutation;
- rollback protection for externally edited installed outputs;
- an explicit limitation on filesystem check-to-replace races; and
- the distinction between file deployment and runtime-verified installation.

The guide was revalidated after those corrections; the size and SHA-256 above
describe the final artifact.

The current official documentation was checked for these structure claims:

- Codex project agents are standalone .codex/agents/*.toml files.
- Codex agent files require name, description, and developer_instructions.
- Codex global subagent limits remain under the agents table.
- Codex repository skills are discovered under .agents/skills.
- Claude imports AGENTS.md from CLAUDE.md with @AGENTS.md on Windows.
- Claude project agents support permissionMode: plan and tool allowlists.
- Claude project skills use .claude/skills/<skill-name>/SKILL.md.

## Not run

- Native PowerShell parser validation: NOT RUN.
- Independent TOML parser validation: NOT RUN.
- Native Claude YAML consumer validation: NOT RUN.
- Harness dry-run or apply: NOT RUN.
- Codex or Claude runtime discovery smoke tests: NOT RUN.
- Frontend dependency installation or build: NOT RUN.
- Backend Maven tests: NOT RUN.
- Security review or secret rotation: NOT RUN.

The local command launcher was unavailable because the Windows sandbox helper
could not start. Static document checks do not replace the native parser,
runtime, build, test, security, or human-review gates.

## Security and blockers

All security blockers already listed in PROGRESS.md remain open. This task does
not claim that credentials were removed, rotated, revoked, or made safe. The
approved rubric and currently stubbed requirement/design documents also remain
outside this task.

## Related files

- docs/tooling/AI-HARNESS-SETUP_v1.md
- docs/ai-logs/m1/2026-07-21-ai-harness-setup-v1-revision.md
- PROGRESS.md
