---
name: karpathy-guidelines
description: Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria.
license: MIT
---

# Karpathy Guidelines

Apply these guidelines when changing this repository.

## Think Before Coding

- State assumptions explicitly.
- Surface multiple interpretations and tradeoffs.
- Prefer the simplest approach that satisfies the request.
- Stop and name genuine ambiguity instead of hiding it.

## Simplicity First

- Implement only requested behavior.
- Avoid speculative abstractions and configurability.
- Keep the implementation as small as the problem allows.

## Surgical Changes

- Touch only files and lines required by the request.
- Match existing style.
- Do not refactor unrelated code or remove pre-existing dead code.
- Remove only orphans introduced by the current change.

## Goal-Driven Execution

- Define observable success criteria.
- For behavior changes, establish a red-capable check before fixing.
- Verify each meaningful step and record the exact evidence.
