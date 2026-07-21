# Review workflow

Use before handing off a completed non-trivial change.

1. Dispatch `code-reviewer` after the final code change and verification.
2. Dispatch `security-reviewer` for every security-sensitive change, even if it
   participated in planning or implementation.
3. For complex work, dispatch independent factual, senior-engineering,
   consistency, and redundancy perspectives in parallel where relevant.
4. The lead resolves or explicitly records each actionable finding, checks the
   final working-tree scope, and reports any unrun gate as `NOT RUN` or
   `BLOCKED`.

Sub-agent reports are evidence inputs. The lead agent retains responsibility for
the final result and may not claim that an unavailable runtime completed a role.
