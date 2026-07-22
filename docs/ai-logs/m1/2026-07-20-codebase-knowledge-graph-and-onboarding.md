# AI Log — Codebase knowledge graph, domain graph, and onboarding guide

- **Date (local):** 2026-07-20
- **Tool:** Claude Code (Opus 4.8), Understand-Anything plugin v2.9.4, Codex CLI 0.144.6
- **Repository commit during the work:** `65d4a94` (branch `chore/harness-setup`)
- **Baseline recovery point:** `1c2d744` — see `docs/tooling/BASELINE.md`
- **Milestone folder:** `m1` — ⚠️ **placeholder choice.** `PROGRESS.md` records the milestone as
  "VERIFY WITH THE LECTURER OR TEAM", so this log is filed under `m1` only because a milestone
  directory is required by `AGENTS.md`. Move it once the real milestone is confirmed.

---

## 1. Task

Three operator-invoked slash commands, run in sequence, plus Codex CLI setup:

1. `/codex:setup` and `/codex:setup --enable-review-gate` — verify the local Codex CLI runtime.
2. `/understand-anything:understand` — generate a codebase knowledge graph.
3. `/understand-anything:understand-domain` — derive a business-domain flow graph from it.
4. `/understand-anything:understand-onboard` — generate an onboarding guide from it.

No application source code was modified. This was analysis and documentation only.

---

## 2. Human validation

**NOT YET PERFORMED.** As of this log, no human has reviewed the generated graphs or the
onboarding guide. Nothing here is approved, and no artifact has been committed.

The reviewer should specifically check:

- The 10 architectural layer assignments and the 12-step tour narrative.
- The 6 business domains, and the three domain-modelling judgement calls in §6.
- The four "will mislead you" warnings at the top of `docs/ONBOARDING.md`.
- Whether the `m1` milestone folder for this log is correct.

---

## 3. What actually ran, and its recorded output

### Codex CLI setup
`node .../codex-companion.mjs setup --json`, then again with `--enable-review-gate`.
Result: `ready: true` · node v24.15.0 · npm 11.12.1 · codex-cli 0.144.6 · ChatGPT auth active ·
sessionRuntime `direct` · `reviewGateEnabled: true`.

### Knowledge graph — `/understand`
Scan: **195 files analysed, 66 filtered** (code 166 / docs 19 / config 6 / data 3 / markup 1);
import map 195 entries / 287 edges. Analysed in 17 semantic batches by subagent.

Merge and review produced:

```
nodes 439   file 167 · function 172 · class 63 · document 19 · config 6 · table 12
edges 873   contains 244 · imports 287 · exports 158 · calls 88 · depends_on 26 ·
            related 22 · documents 17 · configures 10 · defines_schema 9 ·
            tested_by 5 · migrates 4 · implements 3
layers 10   tour steps 12
```

Inline deterministic validation (`.ua/tmp/ua-inline-validate.cjs`) — **RESULT: PASS**,
0 errors, 1 warning:

```
dangling edges   : 0
self-loops       : 0
isolated nodes   : 18
layers           : 10  (204 nodes assigned, 0 file-bearing unassigned)
WARN  18 isolated node(s) with no edges: config:package.json,
      file:Front-end/src/pages/admin/AdminPage.tsx, …
```

Fingerprints baseline built **before** `meta.json` (so future incremental runs diff instead of
escalating to a full re-analysis): `Fingerprints baseline: 195 files`.

### Domain graph — `/understand-domain`
Derived from the existing graph (no re-scan). Freshness preflight: graph commit `65d4a94` ==
`HEAD`, empty committed/staged/unstaged diff. Output: **117 nodes (6 domains, 21 flows,
90 steps), 121 edges**. Validation **PASS** — 0 dangling edges, 0 duplicate IDs; all 90 step
`filePath` values resolve both on disk and to a real code node.

### Onboarding guide — `/understand-onboard`
`docs/ONBOARDING.md`, 337 lines / 20 KB, generated from the graph. Freshness preflight passed
again.

---

## 4. Evidence limits — read before citing this log

- **No test or build command was executed.** `mvn test`, `npm run build` and the scripts under
  `Front-end/scripts/` were all deliberately *not* run. This log contains **no** test, build,
  coverage, or pass-rate evidence, and none may be inferred from it.
- **`JUnit` appears in the graph's detected-framework list.** That is read from `pom.xml`
  dependencies. There is **no `Back-end/src/test` tree at all**. It is not test evidence.
- The 5 `tested_by` edges point at hand-run `.mjs` assertion scripts, not a wired-up runner.
- Per `CLAUDE.md`, Understand-Anything output is **navigation data, not requirements**. None of
  it satisfies a rubric item.

---

## 5. Accepted changes

**New files (all untracked; nothing committed):**

| File | Notes |
|---|---|
| `docs/ONBOARDING.md` | The deliverable. |
| `.ua/knowledge-graph.json` | 439 nodes / 873 edges. |
| `.ua/domain-graph.json` | 6 domains / 21 flows / 90 steps. |
| `.ua/fingerprints.json` | Incremental-update baseline, 195 files. |
| `.ua/meta.json` | Counts, git commit, validation result. |
| `.ua/.understandignore` | Scan-scope exclusions (`.claude/`, `*.css`). |
| `.claude/settings.json` | From `/codex:setup --enable-review-gate`. |

**Corrections applied to the generated graph** (3 edits, each verified before and after;
integrity re-checked after every edit — 0 dangling edges, 0 bad tour/layer refs, 12 steps intact):

1. **Tour step 5** asserted "some services can serve local data when the API is unreachable"
   via `mockStore.ts`. Contradicted by the graph: `mockStore.ts` has **0 inbound imports**.
   Rewritten to present it as a dead-code negative example.
2. **Layer 3 description** carried the same stale "(with a mock store fallback)" claim. Removed.
3. **Tour step 1** told newcomers to read `docs/design/architecture.md` and `docs/srs/SRS.md`
   "first". Those files are 3-line TODO stubs (see §7). Rewritten to warn instead.

**Phase-3 edge recovery.** The merge script silently dropped 8 edges. Both causes were
root-caused and the edges restored rather than accepted as loss:

- 3 `documents` edges — cross-batch node-ID prefix mismatch (`file:*.sql` vs the real
  `table:*.sql` IDs). Retargeted; no duplicate nodes created.
- 5 `tested_by` edges — the merge script's path-convention linker recognises `*.test.*`,
  `*_test.go` and `src/test/**` but not this repo's `Front-end/scripts/<name>-test.mjs`, so it
  misread the script side as production and dropped each pair as a production↔production
  self-link. Restored production→test with a `tested` tag on the 5 production nodes.

---

## 6. Rejected / not done

- **Did not commit anything.** All artifacts are untracked, pending human review.
- **Did not run any build or test command**, per §4.
- **Did not modify application source**, including the files carrying committed credentials —
  those need a rotation decision from an owner, not an edit (§7).
- **Did not delete the discovered dead code** (`Front-end/src/pages/booking/**`,
  `services/mockStore.ts`). `AGENTS.md` forbids deleting legacy code before an approved Git
  recovery strategy exists.
- **No LLM graph-review pass ran** — `/understand` was invoked without `--review`, so Phase 6
  was mechanical checks only. This attests to structural integrity, not semantic quality.
- **Three domain-modelling judgement calls** a reviewer may want revisited:
  *Payments* was modelled as a display-only flow rather than a domain; *staff/counter* as a flow
  under Booking Lifecycle rather than its own domain; *Promotion* and *Voucher* were split
  across two domains rather than merged.

---

## 7. Findings requiring team action

**A. The requirements and design documents are empty.** Verified byte counts:

```
docs/srs/SRS.md                 83 bytes   3 lines
docs/design/architecture.md     92 bytes   3 lines
docs/design/ERD.md              83 bytes   3 lines
docs/design/state-diagram.md    93 bytes   3 lines
docs/rubric/rubric-checklist.md 96 bytes   3 lines
docs/testing/test-cases.md      90 bytes   3 lines
docs/testing/coverage-report.md 95 bytes   3 lines
```

Each contains: *"TODO: content pending. Do not cite this file as evidence while it is empty."*
`FR001`–`FR013` appear throughout file names and migration scripts, but **nothing in this
repository defines what any FR means.** The best surviving record is the migration scripts in
`Back-end/database/` and the manual run-guides under `docs/testing/`. This blocks the existing
`PROGRESS.md` next-action "attach the original rubric".

**B. Committed credentials** (relates to the open security blockers).
`Front-end/src/features/auth/roleAccess.ts` (`LOGIN_ROLE_OPTIONS`) and
`Back-end/src/main/java/com/autowashpro/config/SystemAccountSeeder.java` both ship STAFF/ADMIN
account credentials in tracked source. No values are reproduced in any generated artifact or in
this log. Per `AGENTS.md`, removal alone is insufficient — these accounts require rotation.

**C. Dead code, verified via import edges.**
- `Front-end/src/pages/booking/**` — 18 nodes duplicating the live `features/customer/**`
  wizard. Its only 6 inbound imports originate inside the same folder; nothing outside
  references it. Editing it will not change behaviour.
- `Front-end/src/services/mockStore.ts` — 3 total edges, **0 inbound imports**.

**D. Payment is not implemented.** No payment entity, table, settlement, or reconciliation code
exists. A VietQR URL string is built in `BookingManagementService.toResponse` and rendered by
`StepPayment`; confirming is a UI acknowledgement, **not a verified payment**. If any FR claims
payment processing, this is a gap.

**E. Two admin panels are non-functional shells.** `TierManagementPanel` and
`VoucherManagementPanel` render disabled controls with no backing API.

**F. Repository hygiene.** `.gitignore` covers `.ua/intermediate/` and `.ua/diff-overlay.json`,
but **not** `.ua/tmp/` or `.ua/.trash-*/`, both of which currently exist untracked. A `git add .`
would commit scratch files. Recommend adding both patterns before the next commit.

---

## 8. Related files and artifacts

- `docs/ONBOARDING.md` — the deliverable
- `.ua/knowledge-graph.json`, `.ua/domain-graph.json`, `.ua/meta.json`, `.ua/fingerprints.json`
- `.ua/intermediate/scan-result.json` — preserved deliberately; deleting it forces a full
  ~157k-token re-scan on the next incremental run
- `.ua/.trash-20260720-123902/` — superseded intermediates, recoverable, safe to delete
- `docs/tooling/BASELINE.md` — recovery point `1c2d744`

Working commit at time of writing: `65d4a94`. No commit was created by this work.
