---
name: diagnosing-bugs
description: Diagnosis loop for hard bugs and performance regressions. Use when diagnosing, debugging, or investigating broken, failing, throwing, or slow behavior.
---

# Diagnosing Bugs

Build a tight, deterministic, red-capable feedback loop before forming a theory. Prefer a failing test, then an HTTP script, CLI fixture, browser script, trace replay, or minimal harness.

After the loop is established:

1. Reproduce and minimize the user's exact symptom.
2. Generate three to five ranked, falsifiable hypotheses.
3. Test one variable at a time with targeted instrumentation.
4. Write a regression test at the correct seam before applying the fix.
5. Re-run the original loop, remove debug instrumentation, and record the confirmed cause.

If no red-capable loop can be built, state what was tried and what artifact or environment access is required.
