# Verification workflow

Use after an implementation or configuration change.

1. Run the smallest relevant check first, then the broader gate when practical.
   Use only commands that the repository actually implements.
2. Dispatch `build-error-resolver` immediately after a failed build, typecheck,
   test, or package command. Provide its exact output.
3. Dispatch `e2e-runner` for a changed critical user flow, when an E2E harness
   exists or a safe manual E2E scenario is required.
4. Preserve command, exit code, relevant output, test count, and limitations.
   A command that runs zero tests is not behavioral test evidence.
5. Update progress and the English AI log with only observed results.
