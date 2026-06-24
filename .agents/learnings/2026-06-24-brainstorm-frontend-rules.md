# Development Journal: Brainstorm Frontend & Styling Rules

- **Date**: 2026-06-24
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: N/A

## Summary of Changes
- Established Front-end development rules and styling guidelines for React, TypeScript, and Tailwind CSS.
- Created the detailed Front-end rules file at [rules.md](file:///d:/demoSWP/demo1/Front-end/.agents/rules/rules.md).
- Updated the main workspace rules log [AGENTS.md](file:///d:/demoSWP/demo1/.agents/AGENTS.md).

## Prompt & Requirements Context
- **User Prompt**: Continue brainstorming general rules for both FE and BE (coordination, authentication, git workflow), and define conditions/rules for using HTML, CSS, JavaScript, and Tailwind CSS.
- **Target Audience**: Students, aiming for clean styling, responsive layouts, and simple collaboration workflows.
- **Language/Framework**: React (TypeScript) with Vite/Next.js, Tailwind CSS for styling, and integration with Java Spring Boot backend.

## Technical Decisions & Trade-offs (By Parts)

### Part 1: Front-end Package Structure
- **Decision**: Structured `src/` directory separating `components` (reusable UI), `pages` (views), `services` (API layer), `types` (TS interfaces), and `config` (Axios configuration).
- **Trade-off**: Clear folder structure keeps files focused (High Cohesion) and prevents a messy codebase, making it easy for multiple students to work simultaneously.

### Part 2: Styling (HTML, CSS & Tailwind CSS)
- **Decision**: 
  - Enforce Semantic HTML tags (`<header>`, `<main>`, `<section>`) instead of nested `<div>`s to help with SEO and layout structure.
  - Forbid inline styling (`style="..."`) unless for dynamically computed inline values from state.
  - Enforce Tailwind config custom theme (primary, secondary, etc.) in `tailwind.config.js` and restrict the use of arbitrary values (e.g., `bg-[#xxxx]`, `text-[xx]`).
- **Trade-off**: Forcing Tailwind configuration setup ensures that the entire student team uses the same color palette and typography, preventing design inconsistencies. It takes slightly more setup time but saves immense refactoring effort later.

### Part 3: JS & TS standards
- **Decision**: ES6+ standards, React Functional Components with Hooks, and strict typing (disallowing `any`).
- **Trade-off**: TypeScript helps catch type errors at compile time, which is extremely helpful for students who often make typos in API response structures.

### Part 4: FE-BE Coordination & Git Flow
- **Decision**: 
  - Auth: JWT-based authentication using HTTP Authorization header (`Authorization: Bearer <token>`). Tokens stored in LocalStorage.
  - API Flow: UI-driven API design. FE builds the pages with mock data first, then BE designs APIs to match the mock data schema.
  - Git Flow: Feature branch names correspond to functional requirements (e.g., `feat/req-login`, `feat/req-create-order`).
- **Trade-off**: UI-driven API design helps students visualize their product early on and ensures BE creates APIs that are immediately usable. Git flow by requirement keeps branches isolated and reduces merge conflicts.

## Key Learnings & Gotchas
- Date/time handling is a common pitfall. Forcing ISO 8601 UTC formats for transit and local formatting on FE solves timezone bugs before they happen.
- JWT storage in LocalStorage is chosen over HttpOnly cookies for ease of implementation, since cookie/domain setup can be challenging for students on localhost.

## Next Steps
- Implement and verify code templates for both BE and FE if requested.
