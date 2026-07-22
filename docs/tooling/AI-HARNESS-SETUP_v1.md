# AutoWash Pro AI Harness Setup — v1

## Document status

| Field | Value |
|---|---|
| Document version | 1.0 |
| Date | 2026-07-21 |
| Implementation status | NOT APPLIED |
| Human validation | PENDING |
| Intended repository | AutoWash Pro |
| Original reviewed file | C:\Users\nguye\Downloads\AI-HARNESS-SETUP_v1.md |
| Original SHA-256 | FAAF5A08A280D939A7EA149175377B37B0B41B7DAE4939CB7E6BCBAD3D351219 |

This is version v1 of the migration runbook. Its presence does not mean that
the harness has been installed, verified, or human-approved. Structural
validation, dry-run validation, runtime discovery, repository build/test
evidence, security review, and human approval are reported separately.

## 1. Purpose

This runbook defines a safe, repeatable way to add a shared AI-development
harness for Claude Code and Codex to this existing repository.

The result should:

- preserve the repository policy already recorded in AGENTS.md;
- keep CLAUDE.md and PROGRESS.md human-owned;
- use shared role and workflow content where the two runtimes can safely share
  it;
- use thin runtime-native adapters where their file formats differ;
- vendor optional upstream guidance only at reviewed, immutable commits;
- generate a complete plan before changing a live runtime path;
- manage individual files, never whole runtime directories;
- separate structural checks from actual runtime and build evidence; and
- leave an auditable English AI log after meaningful work.

This runbook does not:

- change application behavior;
- resolve or close any current security blocker;
- invent requirements, rubric evidence, tests, lint scripts, or coverage;
- install plugins, change personal configuration, or trust the project on the
  user's behalf;
- overwrite repository policy or progress files;
- auto-commit, auto-push, rewrite history, or stage unrelated work; or
- execute code obtained from an upstream repository during import.

## 2. Authority and repository facts

### 2.1 Source priority

When sources conflict, use this order:

1. The user's current request and the lecturer's original rubric.
2. A rubric checklist whose entries cite the original rubric.
3. Approved SRS and design documents.
4. Source code and executable tests.
5. Generated knowledge graphs, for navigation only.

Vendored text is reference material, not repository policy. Every adapter must
state that root AGENTS.md wins on conflict. Upstream content remains unmodified;
project-specific policy shims belong in generated adapters.

### 2.2 Verified build facts

The following facts were rechecked against the repository on 2026-07-21:

- Backend build file: Back-end/pom.xml.
- Backend target: Java 17.
- Spring Boot parent: 3.5.6.
- No Maven wrapper is present; an installed Maven executable is required.
- Frontend build file: Front-end/package.json.
- Frontend scripts: dev, build, and preview.
- The frontend has no test or lint script.

Re-read Back-end/pom.xml, Front-end/package.json, and relevant lockfiles before
applying this runbook. If those files changed, update the facts and gates first.

### 2.3 Current project commands

Run commands from the repository root:

~~~powershell
npm --prefix Front-end ci
npm --prefix Front-end run build
mvn -f Back-end/pom.xml test
~~~

Do not add npm test or npm run lint unless the frontend later implements those
scripts. A Maven command that exits successfully with zero tests is build
evidence only, not behavioral test evidence.

## 3. Existing policy and open decisions

### 3.1 Policy already established by the repository

Until a human owner changes AGENTS.md in a separately reviewed edit:

- Superpowers owns planning, implementation workflow, TDD, and branch
  completion.
- ECC is advisory and cannot override repository evidence or workflow policy.
- Understand-Anything output is navigation data, not requirements evidence.
- Codex provides the independent review pass.
- The review entry points remain /codex:review and
  /codex:adversarial-review.

Any imported rule that forbids /codex commands, replaces those review entry
points, or assigns their responsibility elsewhere must be rejected.

### 3.2 Decisions required before installation

Record each answer in the task AI log before the apply phase.

| ID | Decision | Current safe state |
|---|---|---|
| D-001 | How Superpowers is delivered and versioned for this repository | PENDING; do not claim it is installed |
| D-002 | Whether the two /codex review commands are available in the active Claude environment | PENDING runtime check |
| D-003 | Which ECC files are accepted after human review | Existing selection is a candidate, not renewed approval |
| D-004 | Whether existing generated Claude files are adopted, replaced, or preserved | PENDING per-file disposition |
| D-005 | Whether future implementation agents may write files | Out of v1 core; v1 includes read-only planner and reviewer only |

If a required workflow capability is unavailable, stop and record the mismatch.
Do not silently substitute a different workflow or edit AGENTS.md.

## 4. Problems corrected from the downloaded draft

This revision deliberately changes the unsafe or ambiguous parts of the
downloaded document:

- AGENTS.md, CLAUDE.md, PROGRESS.md, and .claude/settings.json are protected
  migration inputs. They are never generated outputs.
- ECC and Superpowers, when both are in scope, are resolved and staged in one
  plan. One vendor step cannot invalidate the next by editing provenance early.
- Every upstream reference resolves to the full Git object ID before any live
  path changes. The currently selected GitHub objects use 40 hexadecimal
  characters.
- Fetching proves identity, not trust. Provenance starts as
  FETCHED — REVIEW PENDING.
- Skill sources are mapped explicitly; the importer never guesses between
  alternative upstream directories.
- The synchronizer owns only files named by its previous ledger. It never
  recursively deletes .claude, .codex, or .agents directories.
- All output is rendered and validated in a candidate directory first.
- Path traversal, absolute paths, case-insensitive collisions, and existing
  reparse-point traversal are rejected before apply.
- A journaled transaction replaces files individually and writes state last.
- Git status includes untracked files. Final staging names exact paths and
  never uses broad repository staging commands.
- Structural, parity, runtime, build/test, security, and human-review results
  are reported separately.
- Smoke tests never modify PROGRESS.md or create fictional work items.
- The v1 core contains two fully specified read-only agents instead of
  promising a larger incomplete inventory.

## 5. Ownership model

| Class | Examples | Owner | Harness behavior |
|---|---|---|---|
| Human-owned policy | AGENTS.md, CLAUDE.md | Repository maintainers | Read and hash; never write |
| Human-owned state | PROGRESS.md | Repository maintainers | Read; propose a separate edit only |
| Human-owned config | .claude/settings.json | Repository maintainers | Read and hash; emit a merge proposal only |
| Canonical harness source | ai/catalog, ai/workflows | Repository maintainers | Reviewed source for generated adapters |
| Immutable vendor snapshot | ai/vendor | Upstream plus repository approval | Exact commit, inventory, license, hashes |
| Generated adapter | .claude/agents, .codex/agents, runtime skills | Harness renderer | File-level ownership recorded in ledger |
| Evidence | docs/ai-logs, docs/tooling | Repository maintainers | Append truthful task records |
| Temporary transaction data | Validated same-volume candidate, backup, and journal paths | Harness process | Never committed; retained on failure for recovery |

AGENTS.md, CLAUDE.md, and PROGRESS.md are human-owned migration inputs, never
generated outputs. Harness tools must not create, replace, truncate, normalize,
or append to them. If a change is desirable, the tool emits a proposal and
stops; a human reviews and applies that change separately.

## 6. Target v1 structure

The following is the target after the decisions and gates in this runbook pass.
It is not a description of the repository's current state.

~~~text
AGENTS.md
CLAUDE.md
PROGRESS.md

ai/
  README.md
  manifest.json
  schema/
    manifest.schema.json
  lock/
    vendors.lock.json
  state/
    managed-files.json
  catalog/
    agents/
      planner.md
      code-reviewer.md
  workflows/
    planning.md
    implementation.md
    verification.md
    review.md
  vendor/
    ecc/
      LICENSE
      rules/
      skills/
    superpowers/
      LICENSE
      selected-files/

scripts/
  ai-harness/
    Test-AiHarnessPreflight.ps1
    New-AiHarnessPlan.ps1
    Invoke-AiHarnessPlan.ps1
    Test-AiHarness.ps1

.claude/
  agents/
    planner.md
    code-reviewer.md
  rules/
    project/
      source-priority.md
    ecc/
      selected files only
  skills/
    selected skills only
  settings.json

.codex/
  config.toml
  agents/
    planner.toml
    code-reviewer.toml

.agents/
  skills/
    selected skills only

docs/
  tooling/
    AI-HARNESS-SETUP_v1.md
    BASELINE.md
    ECC-LICENSE.txt
    UPSTREAM-VERSIONS.md
  ai-logs/
    milestone/
      task log files
~~~

Do not use .ua for harness manifests, locks, state, or temporary data.
This repository already uses .ua for Understand-Anything artifacts.

Runtime skill directories stay flat:
.claude/skills/<skill-name>/SKILL.md and
.agents/skills/<skill-name>/SKILL.md. Provenance grouping belongs in the lock
file, not in an extra runtime directory level.

Additional agent roles are enabled only when their canonical source, both
runtime adapters, permissions, manifest entry, and verification case are all
present. The mandatory-dispatch policy is in AGENTS.md and applies to both
Codex and Claude Code.

## 7. Runtime-native file contracts

### 7.1 Codex

Codex project instructions remain in root AGENTS.md. Project configuration is
loaded only for a trusted project; this runbook does not change trust settings.

Merge the following table into .codex/config.toml. Do not replace unrelated
project settings:

~~~toml
[agents]
max_threads = 4
max_depth = 1
~~~

Each custom agent is a standalone file in .codex/agents. Do not use the older
agents.role table or config_file indirection in .codex/config.toml.

Required planner adapter shape:

~~~toml
name = "planner"
description = "Creates evidence-based implementation plans without editing repository files."
sandbox_mode = "read-only"
developer_instructions = """
Read the repository root AGENTS.md, PROGRESS.md, relevant approved requirements,
affected source, and existing tests. Produce a scoped plan with assumptions,
risks, verification steps, and protected user changes. Do not edit files.
"""
~~~

Required reviewer adapter shape:

~~~toml
name = "code-reviewer"
description = "Performs an independent read-only review and reports actionable findings."
sandbox_mode = "read-only"
developer_instructions = """
Follow the repository root AGENTS.md. Review the requested change against the
user request, approved rubric and design evidence, source, tests, security
policy, and recorded verification. Report findings by severity with file and
line evidence. Do not edit files.
"""
~~~

The fields name, description, and developer_instructions are mandatory.
Omitting a model lets the active Codex configuration choose a compatible
default. A child sandbox preference may be constrained or superseded by the
parent run, so read-only behavior must also be stated in the instructions and
verified at runtime.

Repository skills for Codex live at:

~~~text
.agents/skills/<skill-name>/SKILL.md
~~~

### 7.2 Claude Code

On Windows, CLAUDE.md should import the shared repository instructions as text:

~~~text
@AGENTS.md
@PROGRESS.md
~~~

Do not replace CLAUDE.md with a generated template and do not use a symlink as
the primary Windows setup.

Required planner adapter shape:

~~~yaml
---
name: planner
description: Creates evidence-based implementation plans without editing files
model: inherit
permissionMode: plan
tools: Read, Glob, Grep
---
Read and follow the repository root AGENTS.md and PROGRESS.md. Read the relevant
approved requirements, affected source, and existing tests. Produce a scoped
plan with assumptions, risks, verification steps, and protected user changes.
Do not edit files.
~~~

Required reviewer adapter shape:

~~~yaml
---
name: code-reviewer
description: Performs an independent read-only review with actionable findings
model: inherit
permissionMode: plan
tools: Read, Glob, Grep
---
Follow the repository root AGENTS.md. Review the requested change against the
user request, approved rubric and design evidence, source, tests, security
policy, and recorded verification. Report findings by severity with file and
line evidence. Do not edit files.
~~~

Claude agent names use lowercase letters and hyphens. Each file needs YAML
frontmatter with name and description and a non-empty prompt body. The current
tool name is Agent; Task is a legacy alias. This v1 does not require nested
subagents, so it does not impose a Claude version solely for that feature.

Repository skills for Claude live at:

~~~text
.claude/skills/<skill-name>/SKILL.md
~~~

If a setting is needed, the planning tool reads and parses
.claude/settings.json, emits a minimal merge proposal, and stops. Harness apply
does not write this protected file; a human applies the separately reviewed
edit.

### 7.3 Skill contract

Every managed skill must have:

- one explicit upstream or canonical source path;
- one stable skill ID;
- a destination for each selected runtime;
- a SKILL.md file with valid name and description metadata;
- an inventory of all copied companion files;
- source and rendered SHA-256 hashes; and
- a recorded license and review status when vendored.

Skill IDs and direct-child directory names must match
^[a-z0-9]+(?:-[a-z0-9]+)*$. Before planning any output, scan managed and
unmanaged runtime skills and reject case-insensitive name collisions. Companion
file paths are subject to the same containment and reparse checks as SKILL.md.

Do not infer a source by trying .agents/skills first and skills second. A missing
declared source is a plan failure.

## 8. Manifest, lock, and state contracts

### 8.1 Manifest

ai/manifest.json is reviewed intent. Its JSON Schema must set
additionalProperties to false for every object and accept only schema versions
implemented by the scripts.

The manifest records:

- schemaVersion and rendererVersion;
- protected paths and allowed destination prefixes;
- agent IDs, canonical sources, renderers, and destinations;
- skill IDs, exact source paths, companion files, and destinations;
- rule IDs, source paths, and destinations; and
- required vendor IDs.

The following illustrates the required shape. It is intentionally not
apply-ready because the Superpowers delivery decision is still pending:

~~~json
{
  "schemaVersion": 1,
  "rendererVersion": "1.0.0",
  "protectedPaths": [
    "AGENTS.md",
    "CLAUDE.md",
    "PROGRESS.md",
    ".claude/settings.json"
  ],
  "allowedDestinationPrefixes": [
    ".claude/agents/",
    ".claude/rules/",
    ".claude/skills/",
    ".codex/agents/",
    ".agents/skills/"
  ],
  "vendors": [
    {
      "id": "ecc",
      "repository": "https://github.com/affaan-m/ECC",
      "commit": "754b8dd76ca885b764ec22f476664377aa46b6cd",
      "reviewStatus": "pending"
    },
    {
      "id": "superpowers",
      "repository": "https://github.com/obra/superpowers",
      "commit": null,
      "reviewStatus": "decision-pending"
    }
  ],
  "agents": [
    {
      "id": "planner",
      "source": "ai/catalog/agents/planner.md",
      "outputs": [
        ".claude/agents/planner.md",
        ".codex/agents/planner.toml"
      ]
    },
    {
      "id": "code-reviewer",
      "source": "ai/catalog/agents/code-reviewer.md",
      "outputs": [
        ".claude/agents/code-reviewer.md",
        ".codex/agents/code-reviewer.toml"
      ]
    }
  ]
}
~~~

The apply command must reject null commits, pending decisions, unapproved
vendors, unknown fields, unsupported schema versions, duplicate IDs, duplicate
destinations, and destinations outside the allowlist.

### 8.2 Vendor lock

ai/lock/vendors.lock.json records, for each accepted vendor:

- canonical repository URL;
- requested reference;
- resolved full Git object ID;
- retrieval timestamp;
- license file and license hash;
- complete imported-file inventory and hashes; and
- review status and reviewer identity.

The status after retrieval is FETCHED — REVIEW PENDING. Only a human review can
change it to APPROVED. A mutable branch name or HEAD alone is not an acceptable
lock.

The currently recorded ECC commit is:

~~~text
754b8dd76ca885b764ec22f476664377aa46b6cd
~~~

Re-resolve and verify it against the intended remote before using it. Existing
UPSTREAM-VERSIONS.md is evidence to inspect, not authority to skip review.

### 8.3 Managed-file ledger

ai/state/managed-files.json is written last after a successful transaction.
Every entry records:

- destination;
- canonical source;
- source hash;
- rendered hash;
- renderer version;
- vendor commit when applicable; and
- transaction ID.

Ownership is file-level. An output is replaceable or removable only if the
previous ledger names it and its current hash still equals the recorded
generated hash. Otherwise it is a conflict requiring human disposition.
Runtime directories are never recursively deleted.

## 9. Safety invariants

All implementation scripts are fail-closed and must enforce these rules:

1. Resolve ProjectRoot to a canonical absolute path; never hardcode a user path.
2. Reject rooted manifest paths, empty paths, parent traversal, alternate data
   streams, and destinations outside the repository.
3. Reject traversal through an existing symlink, junction, or other reparse
   point.
4. Compare normalized paths case-insensitively on Windows.
5. Reject duplicate and ancestor/descendant destination collisions.
6. Hard-deny every protected path even if a modified manifest requests it.
7. Read and hash all inputs before render; verify the fingerprints before
   apply and revalidate the affected destination immediately before every
   replacement.
8. Render every output in a newly created candidate path outside all live
   runtime roots, on the destination filesystem volume, and under a validated
   transaction-GUID name.
9. Parse and validate the complete candidate before changing any destination.
10. Produce a deterministic plan and hash; apply only the exact reviewed plan.
11. Record each operation in a crash journal.
12. Replace individual files atomically where the filesystem supports it.
13. Move obsolete managed files to transaction quarantine; do not delete them
    immediately.
14. Write the managed-file ledger and provenance only after all other writes
    succeed.
15. Retain enough journal and quarantine data to resume or roll back after an
    interruption.
16. Never invoke, dot-source, or import executable code from a vendor snapshot.
17. Never use git add -A, git add ., git clean, git reset, or git stash.
18. Never provide a force switch that bypasses path, collision, provenance,
    protected-file, or fingerprint checks.

The filesystem cannot provide one atomic operation across all outputs. The
implementation therefore uses a journaled transaction: render first, record
every operation, atomically replace individual files where supported, write
state last, and keep recovery data until verification succeeds.

### 9.1 Reference path-containment helper

This helper is a minimum requirement, not the entire safety layer:

~~~powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-RepositoryChildPath {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $ProjectRoot,

        [Parameter(Mandatory)]
        [string] $RelativePath
    )

    if ([string]::IsNullOrWhiteSpace($RelativePath)) {
        throw 'Destination path is empty.'
    }

    if ([IO.Path]::IsPathRooted($RelativePath)) {
        throw "Rooted destination is forbidden: $RelativePath"
    }

    if ($RelativePath.Contains(':')) {
        throw "Alternate data streams and drive-relative paths are forbidden: $RelativePath"
    }

    $Segments = @($RelativePath -split '[\\/]')
    if ($Segments -contains '..') {
        throw "Parent traversal is forbidden: $RelativePath"
    }

    $Root = [IO.Path]::GetFullPath($ProjectRoot).TrimEnd(
        [IO.Path]::DirectorySeparatorChar,
        [IO.Path]::AltDirectorySeparatorChar
    )
    $Candidate = [IO.Path]::GetFullPath(
        [IO.Path]::Combine($Root, $RelativePath)
    )
    $Prefix = $Root + [IO.Path]::DirectorySeparatorChar

    if (-not $Candidate.StartsWith(
        $Prefix,
        [StringComparison]::OrdinalIgnoreCase
    )) {
        throw "Destination escapes the repository: $RelativePath"
    }

    $Cursor = $Root
    foreach ($Segment in $Segments) {
        if ([string]::IsNullOrWhiteSpace($Segment) -or $Segment -eq '.') {
            continue
        }

        $Cursor = [IO.Path]::Combine($Cursor, $Segment)
        if (Test-Path -LiteralPath $Cursor) {
            $Item = Get-Item -LiteralPath $Cursor -Force
            if (
                $Item.Attributes -band
                [IO.FileAttributes]::ReparsePoint
            ) {
                throw "Reparse-point traversal is forbidden: $Cursor"
            }
        }
    }

    return $Candidate
}
~~~

The caller must additionally enforce the destination allowlist, protected-path
denylist, reserved Windows names, case-insensitive collision detection, and the
managed-file ledger.

## 10. Dirty-worktree policy

A dirty worktree is not automatically an error because unrelated changes belong
to the user. Discovery and plan generation are read-only and may proceed.

Before planning, capture all tracked and untracked paths:

~~~powershell
git status --short --branch
git status --porcelain=v1 --untracked-files=all
~~~

Apply is blocked when:

- a planned destination already has an unresolved user change;
- a protected file changed after planning;
- a canonical source, manifest, lock, or other migration input changed after
  planning;
- an existing destination has no explicit adopt, preserve, replace, or
  quarantine decision; or
- the complete status cannot be recorded.

Unrelated user changes are preserved. HEAD cannot recover uncommitted work.
No legacy file may be replaced or retired until docs/tooling/BASELINE.md records
a human-approved, reachable commit that can restore it and all uncommitted
overlaps have a separate recovery plan.

## 11. Migration phases and gates

### G0 — Read-only discovery

1. Read PROGRESS.md.
2. Read AGENTS.md, CLAUDE.md, BASELINE.md, UPSTREAM-VERSIONS.md, the relevant
   approved requirements and designs, affected source, and existing tests.
3. Recheck pom.xml, package.json, and lockfiles.
4. Capture the complete Git status, including untracked files.
5. Record tool versions without treating version output as setup success.
6. Inventory every existing path that a proposed output could touch.
7. Hash protected files and all migration inputs.

Useful commands:

~~~powershell
$ProjectRoot = (Resolve-Path '.').Path
git -C $ProjectRoot rev-parse --show-toplevel
git -C $ProjectRoot status --porcelain=v1 --untracked-files=all
git -C $ProjectRoot rev-parse HEAD
git --version
pwsh --version
node --version
npm --version
mvn -version
claude --version
codex --version
~~~

Check the Java runtime reported by Maven. A different default java executable
does not prove that Maven uses the backend's required Java 17.

Pass criteria: repository/build facts, full status, protected hashes, existing
destination inventory, and exact command results are captured with no writes.

### G1 — Recovery boundary and disposition

1. Verify that the commit in docs/tooling/BASELINE.md exists and is reachable.
2. Confirm that the recorded commit is approved as the legacy recovery point.
3. Record separate recovery handling for uncommitted overlapping files.
4. Classify every existing destination as adopt, preserve, replace, quarantine,
   or conflict.

Pass criteria: every affected file has a recoverable and human-approved
disposition. A repository commit never stands in for uncommitted content.

### G2 — Supply-chain resolution

1. Resolve each requested upstream reference to one exact commit.
2. Stage all selected vendors in one isolated candidate transaction.
3. Verify repository URL, commit object, license, complete selected inventory,
   and hashes.
4. Inspect the Git tree before checkout and reject symlinks, gitlinks,
   submodules, path escapes, and case-insensitive path collisions.
5. Never execute, dot-source, import, or dynamically inject anything from the
   snapshot during retrieval or review.
6. Review selected text for prompt injection, secret access, network access,
   hooks, dynamic command expansion, and attempts to override AGENTS.md.
7. Mark provenance FETCHED — REVIEW PENDING.
8. Obtain human review before marking selected content APPROVED.

ECC and Superpowers, if both are selected, are resolved, staged, validated, and
recorded by the same plan and transaction. UPSTREAM-VERSIONS.md is a transaction
output, not a clean-worktree precondition between two vendor scripts.

Pass criteria: every imported byte is associated with a reviewed repository,
full commit, license, inventory, and hash; all required vendors are approved.

### G3 — Deterministic render plan

New-AiHarnessPlan.ps1 must:

1. validate the manifest against its strict schema;
2. validate all canonical and vendor source paths;
3. resolve and validate every destination;
4. reject collisions and protected paths;
5. render the full candidate tree outside live roots on the destination
   filesystem volume;
6. parse TOML, JSON, YAML frontmatter, and skill metadata;
7. compute source, rendered, and input hashes;
8. compare the candidate with the live tree and prior ledger;
9. emit per-file operations and human dispositions; and
10. write a deterministic plan plus plan SHA-256 without changing live files.

The hashed authorization payload excludes display timestamps, temporary
absolute paths, and other machine-specific observations. Those values may be
stored in a non-authorizing evidence envelope. Replanning from identical inputs
must therefore produce the same content and authorization hash.

Pass criteria: the candidate is complete and valid, the plan contains no
unresolved item, and repeated planning from identical inputs yields the same
content plan and authorization hash.

### G4 — Human plan approval

The reviewer checks:

- every create, adopt, replace, preserve, and quarantine operation;
- the protected-file hash report;
- vendor inventory and license;
- adapter policy shims;
- unexpected and untracked files under runtime roots; and
- the exact plan hash.

Pass criteria: the human records acceptance of that exact plan hash. A general
approval of this document is not approval of a future generated plan.

### G5 — Journaled apply

Invoke-AiHarnessPlan.ps1 must:

1. require the approved plan file and exact plan hash;
2. reacquire a repository-scoped lock;
3. recheck all input and destination fingerprints;
4. stop before the first write if anything changed;
5. initialize the crash journal and quarantine;
6. immediately before each operation, re-resolve destination containment,
   recheck every existing parent for reparse points, and compare the current
   destination hash and existence state with the reviewed plan;
7. on a per-operation mismatch, stop, journal the conflict, and roll back only
   earlier outputs whose current hashes still match the transaction hashes;
8. apply only that reviewed file operation;
9. verify all installed output hashes again before finalizing;
10. write lock, provenance, and managed state last; and
11. retain recovery data until verification passes.

Candidate and backup paths for each destination must be validated sibling paths
or otherwise proven to be on the same filesystem volume before relying on a
rename. Cross-volume moves are not atomic.

The repository-scoped lock coordinates harness processes only; it cannot stop
an editor, watcher, antivirus tool, or another process from changing a live
file. The human must keep the planned write set quiescent during apply.
Per-operation checks narrow but cannot mathematically eliminate the final
check-to-replace race on a general filesystem. Rollback must never overwrite a
post-write external edit: if an installed hash changed, retain recovery data,
report incomplete rollback, and require human reconciliation.

There is no bypass switch. A failed apply reports the journal location and
whether rollback completed; it never reports success.

Pass criteria: every journal operation completed, inputs remained unchanged,
protected hashes are unchanged, and rollback remains available.

### G6 — Structural, parity, and idempotence verification

Test-AiHarness.ps1 must derive its expected inventory from the manifest, not
from hardcoded counts. It verifies:

- manifest and lock schema;
- supported schema and renderer versions;
- full vendor inventory and hashes;
- every canonical source and declared companion file;
- every expected output and no unexpected managed output;
- duplicate agent/skill names and case-insensitive destination collisions;
- Codex TOML required fields and parseability;
- Claude YAML frontmatter, naming, and non-empty prompt bodies;
- SKILL.md metadata and companion files;
- protected-file hashes;
- managed-ledger source/rendered hash parity;
- regeneration into a fresh candidate produces identical rendered hashes; and
- a second plan contains no operations.

An adapter can contain frontmatter or a policy shim, so source and output hashes
need not be equal. Parity means rerendering from the locked source produces the
recorded output hash.

Pass criteria: all structural and parity checks pass and the second plan is
empty. This does not prove that either runtime loaded the files.

### G7 — Runtime discovery

Using the actual installed clients:

1. verify Codex discovers every manifest-listed project agent and selected skills;
2. verify Claude discovers every manifest-listed project agent and selected skills;
3. invoke a representative applicable role on a harmless read-only prompt; and
4. verify no role changed the working tree.

The project owner must explicitly trust the project before relying on project
Codex configuration. If a client or required plugin is absent, incompatible,
or not tested, report NOT RUN or FAIL as appropriate. File existence alone is
not runtime discovery.

Pass criteria: each manifest-listed adapter is loaded by its real runtime and
the read-only smoke cases leave Git status unchanged.

### G8 — Repository build/test gate

Run the smallest relevant check first, then the broader gate when practical:

~~~powershell
npm --prefix Front-end ci
npm --prefix Front-end run build
mvn -f Back-end/pom.xml test
~~~

Record the exact command, exit code, relevant output, Maven test count, and
working-tree state. Do not run nonexistent frontend test or lint scripts.

Pass criteria: only commands actually run and observed may be marked PASS.
Zero Maven tests is not behavioral evidence.

### G9 — Evidence and handoff

1. Add an English log under docs/ai-logs/<milestone>/.
2. Record task scope, plan hash, human validation, exact commands and results,
   test counts, accepted and rejected changes, blockers, and related files or
   commit.
3. Update PROGRESS.md as a separate human-reviewed edit.
4. Keep security blockers open until their own evidence exists.
5. Review the complete unstaged and staged scope.
6. Stage only explicitly named, accepted paths.

Example review commands:

~~~powershell
git status --short
git diff -- docs/tooling/AI-HARNESS-SETUP_v1.md
git diff --cached --name-status
git diff --cached
~~~

Do not stage or commit automatically. If the human chooses to stage, name every
accepted path explicitly.

Pass criteria: evidence is truthful and scoped; no security value is copied
into logs; human validation remains PENDING until actually supplied.

## 12. Required failure tests before adopting mutating scripts

Test the implementation in a disposable fixture, never first in this working
repository. At minimum, prove:

- dry-run produces no filesystem or Git-state change;
- unrelated dirty files are preserved;
- an overlapping dirty destination blocks before the first write;
- an absolute path, parent traversal, and repository escape are rejected;
- a symlink or junction escape is rejected;
- path collisions that differ only by case are rejected on Windows;
- a missing source and destination collision fail before apply;
- protected paths are rejected even when requested by a modified manifest;
- an existing unowned file requires an explicit disposition;
- a user-edited managed output is a conflict, not removable;
- no whole .claude, .codex, or .agents directory is deleted;
- ECC and Superpowers can be planned together without provenance ordering
  deadlock;
- a mutable upstream reference resolves to a full commit;
- vendor import never executes upstream code;
- an injected mid-apply failure can be rolled back or resumed;
- a concurrent destination mutation is detected before replacement or during
  final verification, and rollback does not overwrite that external edit;
- a second plan is empty after successful apply;
- runtime discovery is not inferred from file existence; and
- no command uses git add -A, git add ., git clean, git reset, git stash,
  Invoke-Expression, remote-script piping, or bypass-permission flags.

Until these tests exist and pass, the mutating scripts are design targets, not
approved automation. Manual edits must still follow the same per-file review,
protection, evidence, and rollback rules.

## 13. Result vocabulary

Tools and logs use only claims justified by their evidence:

| Result | Meaning |
|---|---|
| STRUCTURAL: PASS | Schema, parse, inventory, and static contracts passed |
| DRY-RUN: PASS | The validated plan produced no live changes |
| PARITY: PASS | Fresh rerender hashes match the managed ledger |
| RUNTIME: PASS | Real Codex and Claude clients discovered and exercised all listed adapters |
| BUILD: PASS | The named repository build command ran successfully |
| TESTS: PASS | Tests actually executed and passed; the count is recorded |
| SECURITY: PASS | A separately scoped security review passed with evidence |
| HUMAN REVIEW: APPROVED | A named human approved the exact artifact or plan |
| NOT RUN | The check was not performed; it is not a pass |
| BLOCKED | A named prerequisite or conflict prevented the check |

The preflight success message is:

~~~text
Tooling preflight passed. Security, runtime discovery, builds, and tests were not evaluated.
~~~

Never print AI harness verification passed as a substitute for the separate
results above.

## 14. Acceptance checklist for this runbook

The document itself is ready for human acceptance when:

- [ ] The repository owner confirms the source-priority and workflow-owner
      wording matches AGENTS.md.
- [ ] The owner decides D-001 through D-004.
- [ ] All mentioned paths use repository-relative form except the recorded
      source-file provenance.
- [ ] Protected files are denied as generated destinations.
- [ ] Managed ownership is per-file and backed by hashes.
- [ ] Vendor refs are full commits and provenance distinguishes fetch from
      approval.
- [ ] Codex structure uses .codex/agents/*.toml with name, description, and
      developer_instructions.
- [ ] Codex project skills use .agents/skills/<name>/SKILL.md.
- [ ] Claude structure uses .claude/agents/*.md and
      .claude/skills/<name>/SKILL.md.
- [ ] Existing .claude/settings.json is preserved.
- [ ] The two core roles have complete adapters in both runtimes.
- [ ] Structural, parity, runtime, build/test, security, and human approval are
      separate claims.
- [ ] Every runnable PowerShell, JSON, and TOML block parses successfully.
- [ ] Mutating automation passes the disposable-fixture failure tests.
- [ ] The exact evidence is recorded without leaking secrets.

File deployment is complete only when G0 through G6 and G9 pass. Do not call
the harness installed or runtime-compatible until G7 also passes with the real
clients. Repository build/test status is claimed only from G8 evidence.
Security remains a separate gate.

## 15. Authoritative references

Codex:

- AGENTS.md guidance:
  https://developers.openai.com/codex/guides/agents-md
- Project configuration and trust:
  https://developers.openai.com/codex/config-file/config-basic
- Custom subagents:
  https://developers.openai.com/codex/agent-configuration/subagents
- Skills:
  https://developers.openai.com/codex/build-skills

Claude Code:

- Memory and CLAUDE.md:
  https://code.claude.com/docs/en/memory
- Subagents:
  https://code.claude.com/docs/en/sub-agents
- Skills:
  https://code.claude.com/docs/en/skills
- Settings:
  https://code.claude.com/docs/en/settings

Upstream candidates:

- Everything Claude Code:
  https://github.com/affaan-m/ECC
- Superpowers:
  https://github.com/obra/superpowers

Official runtime documentation and the repository itself take precedence over
this runbook if either changes. Re-review this document before applying it with
new client versions, manifest schema, renderer version, vendor commit, build
metadata, or repository policy.
