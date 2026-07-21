# Planning workflow

Use for a complex feature, refactor, architectural choice, or an unclear task.

1. The lead reads `AGENTS.md`, `PROGRESS.md`, relevant approved requirements,
   design documents, affected source, and tests.
2. Dispatch `planner`.
3. Dispatch `architect` when a component boundary, API, data model, deployment,
   or cross-module design decision is involved.
4. Dispatch `security-reviewer` in parallel when the request touches auth,
   authorization, input, payment, loyalty, secrets, or administration.
5. Consolidate evidence, assumptions, blocked questions, and a validation plan
   before any write.

The lead does not treat a plan as authorization to invent requirements or alter
unrelated user changes.
