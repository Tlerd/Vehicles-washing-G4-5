---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when designing or improving module interfaces, seams, testability, or AI-navigable code.
---

# Codebase Design

Use the following vocabulary consistently when designing or restructuring code:

- **Module**: anything with an interface and an implementation.
- **Interface**: everything callers must know, including invariants, ordering, errors, configuration, and performance.
- **Implementation**: the code behind the interface.
- **Depth**: how much behavior a caller can exercise per unit of interface learned.
- **Seam**: where behavior can be changed without editing the caller.
- **Adapter**: a concrete implementation that satisfies an interface at a seam.
- **Leverage**: capability gained by callers from a deep interface.
- **Locality**: concentration of change, bugs, knowledge, and verification.

Prefer deep modules: a small, stable interface with substantial behavior behind it. Design for testability by accepting dependencies, returning results, and keeping the interface small. Do not introduce a seam unless variation or a testing need justifies it.
