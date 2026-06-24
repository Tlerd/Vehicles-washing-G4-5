# Development Journal: Brainstorm Backend Rules for Java Spring Boot

- **Date**: 2026-06-24
- **Author**: Agent (Antigravity)
- **Story/Feature Reference**: N/A

## Summary of Changes
- Brainstormed and established a comprehensive set of development rules for Java Spring Boot backend development tailored for students.
- Created the detailed backend rules document at [rules.md](file:///d:/demoSWP/demo1/Back-end/.agents/rules/rules.md).
- Created the design spec document detailing decisions and rationale at [2026-06-24-backend-rules-design.md](file:///d:/demoSWP/demo1/docs/superpowers/specs/2026-06-24-backend-rules-design.md).

## Prompt & Requirements Context
- **User Prompt**: Brainstorm rules for BE regarding standard project structure, design based on coupling & cohesion, MVC or SOLID standards, tailored for students. Subsequently, added requirements for RESTful API naming, database naming, and Swagger/OpenAPI setup.
- **Target Audience**: Students, requiring easy-to-understand patterns but keeping industry-standard practices.
- **Language/Framework**: Java (Spring Boot 3).

## Technical Decisions & Trade-offs (By Parts)

### Part 1: Project & Package Structure
- **Decision**: Traditional Layered Architecture: `Controller -> Service Interface -> Service Impl -> Repository -> Entity/DTO`.
- **Trade-off**: Adding Service Interfaces adds some file boilerplate, but it is necessary for Loose Coupling (Program to Interface) and is standard in the Spring Boot community.

### Part 2: Coupling, Cohesion & SOLID
- **Decision**: Strict separation of database `Entity` from API `DTO` (RequestDTO and ResponseDTO). Use `ModelMapper`/`MapStruct` in `mapper` package. Allow `@Autowired` field injection for simplicity instead of forcing Constructor Injection (which can be verbose and confusing for students).
- **Trade-off**: Direct `@Autowired` field injection reduces boilerplate and learning curve for students, though it makes pure unit testing slightly harder. We prioritized ease of understanding.

### Part 3: Exception Handling & Validation
- **Decision**: Enforce `@RestControllerAdvice` as a Global Exception Handler and Jakarta Validation (`@NotBlank`, `@NotNull`, etc.) in DTOs.
- **Trade-off**: This avoids messy `try-catch` blocks and manual validation checks in controllers and services, which dramatically increases code cohesion.

### Part 4: API & Database Naming Conventions
- **Decision**: 
  - RESTful: Plural nouns (e.g. `/api/v1/users`), lowercase kebab-case paths, appropriate HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
  - Database: Lowercase snake_case, plural table names, singular table name + `_id` for foreign keys (e.g. `user_id`). Annotate Entities explicitly with `@Table` and `@Column`.

### Part 5: API Documentation
- **Decision**: Use `springdoc-openapi-starter-webmvc-ui` for Swagger documentation. Annotate controllers with `@Tag`, operations with `@Operation`, and DTO fields with `@Schema`. Expose Swagger UI at `/swagger-ui/index.html`.

## Key Learnings & Gotchas
- When teaching students, abstract patterns (like Clean Architecture) are often too complex. Traditional Layered Monolith with interfaces and DTOs is the sweet spot between code quality (low coupling) and simplicity.
- Standardizing API response wrappers was discussed, but rejected to avoid over-complicating API code for students. Returning DTOs/Lists directly keeps things simple.

## Next Steps
- Implement frontend guidelines if requested.
- Ready to scaffold backend code based on these rules.
