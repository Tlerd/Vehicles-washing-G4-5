# Team hierarchy workflow

The root agent chooses a team lead when a task is primarily frontend, backend,
or testing. The lead is an orchestration role and must invoke every applicable
specialist child before returning its recommendation.

```text
root agent
├── frontend-lead
│   ├── frontend-ui-specialist
│   ├── frontend-state-specialist
│   └── frontend-quality-specialist
├── backend-lead
│   ├── backend-api-specialist
│   ├── backend-data-specialist
│   └── backend-security-specialist
└── testing-lead
    ├── unit-test-specialist
    ├── integration-test-specialist
    └── e2e-runner
```

Run independent specialists in a single parallel wave of up to five agents.
When a team has more than five applicable specialists or cross-cutting roles,
finish and integrate the first wave before starting the next. Cross-cutting work also dispatches
the corresponding existing role: `architect`, `tdd-guide`, `security-reviewer`,
or `code-reviewer`. Leads and specialists are read-only evidence roles; the root
agent performs scoped writes after integrating their results.

For a cross-stack feature, the default first wave is `frontend-lead`,
`backend-lead`, `testing-lead`, and `security-reviewer` when security-sensitive
data is involved. For a frontend-only change, use the three frontend specialists
plus `testing-lead` directly. For a backend-only change, use the three backend
specialists plus `testing-lead` directly. Do not run independent scopes
sequentially.
