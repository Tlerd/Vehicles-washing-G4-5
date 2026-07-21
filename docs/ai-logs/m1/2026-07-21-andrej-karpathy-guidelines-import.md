# Andrej Karpathy Guidelines Import

Date: 2026-07-21

## Task

Import `CLAUDE.md` from the user-requested `forrestchang/andrej-karpathy-skills`
repository into this project.

## Evidence

- GitHub's repository API resolved the requested repository redirect to
  `multica-ai/andrej-karpathy-skills`.
- The resolved upstream file is
  `https://raw.githubusercontent.com/multica-ai/andrej-karpathy-skills/main/CLAUDE.md`.
- Resolved upstream Git object SHA: `daced9bd64f25908ebedeb4701fb406985dc8366`.
- The local `CLAUDE.md` already contained project-specific instructions and
  local modifications, so it was not overwritten.

## Accepted change

- Added the complete upstream behavioral guidelines under an explicitly marked
  imported section in root `CLAUDE.md`.
- The existing project instructions remain first and explicitly take precedence.

## Rejected change

- Did not attempt the Claude plugin marketplace commands because this runtime is
  Codex and the requested repository provides a standalone `CLAUDE.md` for the
  direct-import alternative.

## Validation

- Confirm the imported section, source URL, and SHA are present in `CLAUDE.md`.
