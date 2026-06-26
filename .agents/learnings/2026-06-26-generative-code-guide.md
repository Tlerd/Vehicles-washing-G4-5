# Development Journal: Generative Code Guide Creation

- **Date**: 2026-06-26
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: N/A

## Summary of Changes
- Created a comprehensive guide for AI code generation (generative code) for both Front-end and Back-end at [generative_code_guide.md](file:///d:/demoSWP/Vehicles-washing-G4-5/generative_code_guide.md).
- Provided ready-to-use System Prompts for both FE (React + TypeScript + Tailwind) and BE (Spring Boot 3 + Java 17) environments.
- Defined a checklist to verify the generated code quality before integration and commit.

## Context
- The user requested checking the project and creating a generative code instruction file for both FE and BE components.
- The guide is written in Vietnamese to match the team's standard documentation language.

## Key Decisions & Details
- **Front-end Prompt**: Embeds constraints such as TS strict typing (forbidding `any`), semantic HTML, Vite/Next.js structure, Tailwind styling config, components sized under 300 lines, Axios interceptors for Auth, and ISO 8601 UTC to GMT+7 date-time handling.
- **Back-end Prompt**: Embeds constraints such as Spring Boot 3 layered architecture, strict Entity/DTO separation, validation using Jakarta annotations, global exception handling, RESTful plural resources in kebab-case, SQL Server naming conventions, and springdoc-openapi Swagger docs.
- **Checklist**: Built a checklist matrix covering both FE and BE compliance points to help developers verify AI-generated output.
