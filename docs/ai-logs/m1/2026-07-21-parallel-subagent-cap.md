# AI Log — Parallel Sub-agent Cap

## Task

Configure project orchestration so independent work is dispatched in parallel,
with a maximum of five sub-agent threads per wave.

## Accepted changes

- Set `.codex/config.toml` `agents.max_threads` to 5.
- Added a mandatory wave-dispatch protocol to `AGENTS.md`: identify independent
  work, launch 2–5 scoped agents in parallel, wait for all results, and only
  then begin dependent work.
- Updated the team workflow to use waves of at most five agents.

## Validation

Pending structural verifier run after the configuration checksum update. Runtime
dispatch remains separately blocked for Codex by the Windows sandbox helper.

## Human validation

PENDING.
