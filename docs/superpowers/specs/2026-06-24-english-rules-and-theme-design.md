# Design Specification: English Standardization & Theme Toggle Guidelines

This design document outlines the plan to standardize all project development rules (back-end and front-end guidelines) to English, establish rules for a single-language English user interface, and define implementation standards for a dark/light mode toggle in the front-end application.

---

## 1. Context & Objectives

*   **Context**: The project consists of a Java Spring Boot Back-end and a React/TypeScript/Tailwind CSS Front-end developed by students. Currently, development rules and project logs are mixed between Vietnamese and English.
*   **Objectives**:
    *   Standardize all agent instructions, developer rules, and project logs (`AGENTS.md`, `rules.md` files) to **English** to ensure consistency for future AI agents and developers.
    *   Enforce a **single-language English** rule for the front-end application's user interface.
    *   Define architectural and implementation standards for a **Dark/Light Mode** theme switcher in the front-end.
*   **Target Audience**: Students and coding agents working on the codebase.

---

## 2. Design Decisions

### 2.1. Rule & Workspace Documentation Language
*   **Decision**: Translate all `.agents/AGENTS.md`, `Front-end/.agents/rules/rules.md`, and `Back-end/.agents/rules/rules.md` files entirely into English.
*   **Rationale**: Large Language Models (LLMs) and code assistants exhibit superior performance, class/variable formatting, and instruction-following when rules are provided in English. It also prepares students for professional, international coding environments.

### 2.2. Single-Language English Application UI
*   **Decision**: Enforce that the entire application UI (buttons, labels, headings, error messages, and placeholders) must be in English.
*   **Rationale**: Simplifies frontend architecture by avoiding translation libraries like `react-i18next` early on, reducing package count and preventing dependency bloat.

### 2.3. Dark/Light Theme Switching (Front-end)
*   **Decision**: Establish a standard React Theme Context combined with Tailwind CSS class-based dark mode.
*   **Key Guidelines**:
    1.  **Tailwind Configuration**: Ensure `darkMode: 'class'` is set in `tailwind.config.js`.
    2.  **State Management**: Create a `ThemeContext` storing the current theme (`'light'` or `'dark'`).
    3.  **Synchronization & Persistence**:
        *   Toggling the theme must add/remove the `'dark'` class from `document.documentElement`.
        *   Save the current theme state in `localStorage` under the key `'theme'`.
        *   Initialize the theme by checking `localStorage`, and falling back to system preference (`window.matchMedia('(prefers-color-scheme: dark)').matches`).
    4.  **Styling Implementation**: Write styles using Tailwind's `dark:` modifier (e.g., `bg-white dark:bg-slate-900`). Apply transition classes (`transition-colors duration-200`) on background/text to ensure smooth toggling.

---

## 3. Proposed Changes

### [Component: Workspace Rules & Configuration]

#### [MODIFY] [AGENTS.md](file:///d:/demoSWP/demo1/.agents/AGENTS.md)
*   Translate log entries and guidelines into English.
*   Add a new log entry for 2026-06-24 noting the English standardization and the addition of theme toggle rules.

#### [MODIFY] [rules.md](file:///d:/demoSWP/demo1/Front-end/.agents/rules/rules.md)
*   Translate Front-end development rules into English.
*   Add a new section: **Section 5: Dark/Light Mode Theme Implementation Guidelines** (detailing `ThemeContext`, Tailwind configuration, persistence, and transitions).
*   Add a guideline stating that the application's default and only language is English, and no i18n libraries are required.

#### [MODIFY] [rules.md](file:///d:/demoSWP/demo1/Back-end/.agents/rules/rules.md)
*   Translate Back-end Spring Boot development rules into English.

---

## 4. Verification Plan

### Manual Verification
1.  **Readability Check**: Verify that all modified markdown files ([AGENTS.md](file:///d:/demoSWP/demo1/.agents/AGENTS.md), Front-end `rules.md`, and Back-end `rules.md`) are written in grammatically correct, technical English without any leftover Vietnamese text.
2.  **Structural Conformity**: Ensure the new rules files do not have broken links or placeholder sections.
3.  **Git Status & Commit**: Verify files are correctly saved and committed.
