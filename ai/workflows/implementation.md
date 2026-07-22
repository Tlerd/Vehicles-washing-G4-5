# Implementation workflow

Use after the request and evidence are sufficient to make a change.

1. Dispatch `tdd-guide` for every behavior change or bug fix where a test
   harness exists; add the smallest failing test before implementation.
2. Dispatch `refactor-cleaner` before deleting, consolidating, or replacing
   legacy code. Preserve the recovery strategy required by `AGENTS.md`.
3. The lead performs the scoped implementation and records exact changed files.
4. Dispatch `doc-updater` when requirements, runbooks, user-facing behavior,
   or evidence documentation must change.
5. Dispatch `security-reviewer` again if the implementation alters a
   security-sensitive boundary.

Specialized roles are required only when relevant: `rust-reviewer` for Rust and
`harmonyos-app-resolver` for HarmonyOS or ArkTS.
