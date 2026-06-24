---
name: development-journal
description: Use when completing a task, ending a coding session, or capturing progress, design choices, and technical learnings for future agents in `.agents/learnings/`
---

# Development Journal Skill

## Overview
This skill provides a structured way for agents to record their progress, design decisions, and key technical learnings at the end of each session or task. These journals are stored as Markdown files in the [learnings](file:///d:/demoSWP/demo1/.agents/learnings/) directory.

## When to Use
- **End of session**: Before passing control back to the human user or another agent.
- **Task completion**: After finishing a story packet, feature, or bug fix.
- **Architectural decision**: When making non-obvious design trade-offs or refactoring core structures.
- **Discovery of gotchas**: When finding repository quirks, tricky bugs, or special configuration requirements.

### When NOT to Use
- Do not use for general, minor comments or questions to the user (ask directly in the chat).
- Do not use for documenting user stories (use [docs/stories/](file:///d:/demoSWP/demo1/.agents/docs/stories/) instead).

---

## Core Pattern

### File Naming Convention
Create a new file in [learnings/](file:///d:/demoSWP/demo1/.agents/learnings/) with the format:
```
YYYY-MM-DD-[story-id-or-short-description].md
```
*Example:* `2026-06-24-create-development-journal-skill.md`

### Journal Template
Every journal entry should follow this structure:

```markdown
# Development Journal: [Short Task Title]

- **Date**: YYYY-MM-DD
- **Author**: Agent (Antigravity) / Human
- **Story/Feature Reference**: [Link to story or issue if applicable]

## Summary of Changes
Provide a brief, high-level summary of what was accomplished and list the main files modified.

## Technical Decisions & Trade-offs
Explain *why* the implementation was done this way. Note any alternative paths considered and why they were rejected.

## Key Learnings & Gotchas
Identify any challenges, bugs, API quirks, or repository-specific details encountered. This is critical for future agents to avoid repeating mistakes.

## Next Steps
List outstanding items, potential follow-ups, or verification tasks for the next session.
```

---

## Example Entry

### Good Example
```markdown
# Development Journal: Fix Auth Token Expiry Race Condition

- **Date**: 2026-06-24
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: [auth-refresh-flow](file:///d:/demoSWP/demo1/.agents/docs/stories/auth-refresh.md)

## Summary of Changes
- Refactored the token refresh interceptor in `Front-end/src/lib/api-client.ts`.
- Added a mutex to queue concurrent API requests while the token is refreshing.

## Technical Decisions & Trade-offs
- Used a simple in-memory queue instead of a heavy external library to minimize bundle size.
- Chose to retry failed requests up to 3 times with exponential backoff rather than failing immediately.

## Key Learnings & Gotchas
- **Gotcha**: The auth server returns a 403 instead of a 401 on token expiration. Standard interceptors checking only 401 will fail to trigger token refresh.
- **Learning**: Always verify the exact response codes returned by this custom auth service in testing before writing error-handling logic.

## Next Steps
- Verify token refresh behavior on unstable/slow network connections.
```

---

## Common Mistakes & Red Flags

- ❌ **Empty summaries**: "Updated files" without describing the context.
- ❌ **No learnings**: Claiming "no issues encountered" when a complex bug was resolved. Always write down what was learned.
- ❌ **Inconsistent names**: Naming files `diary.md` or `my_log.md` instead of `YYYY-MM-DD-[short-description].md`.
- ❌ **Writing in root directories**: Placing journal files outside the [learnings](file:///d:/demoSWP/demo1/.agents/learnings/) directory.
