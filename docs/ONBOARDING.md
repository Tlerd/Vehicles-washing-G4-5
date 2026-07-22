# AutoWash Pro — Onboarding Guide

> Generated from the Understand-Anything knowledge graph (`.ua/knowledge-graph.json`)
> at commit `65d4a94`, covering 195 scanned files / 439 graph nodes / 873 edges.
>
> **This guide is navigation data, not requirements.** Per `AGENTS.md`, the authoritative
> sources are the lecturer's original rubric and the approved SRS/design documents — and
> as noted below, those documents are currently empty in this repository. Nothing here is
> evidence of tests, coverage, or rubric compliance.

---

## Read this first: four things that will mislead you

Before the tour, four facts about this repository that are not obvious from the file tree
and that will waste your time if you discover them the hard way.

**1. The design and requirements docs are empty stubs.**
`docs/srs/SRS.md`, `docs/design/architecture.md`, `docs/design/ERD.md`, and
`docs/design/state-diagram.md` are each 3 lines long and say verbatim:
*"TODO: content pending. Do not cite this file as evidence while it is empty."*
The `FR001`–`FR013` requirement numbers appear throughout file names and migration scripts,
but **no document in this repo defines what those FRs are.** The best surviving record is
the migration scripts in `Back-end/database/` plus the manual run-guides in `docs/testing/`.
Ask the team for the original rubric before assuming any FR behaviour.

**2. There is no test suite.**
`Front-end/package.json` exposes exactly three scripts: `dev`, `build`, `preview`.
The `.mjs` files under `Front-end/scripts/` are standalone assertion scripts run by hand
with `node`. There is **no `Back-end/src/test` tree at all**, no wired-up runner, and no
measured coverage anywhere. (`JUnit` appears in the detected framework list only because
it is declared in `pom.xml`.) Do not claim a pass rate or coverage figure from this repo.

**3. Two large regions are dead code.**
- `Front-end/src/pages/booking/**` (18 nodes) is a near-duplicate of the live
  `Front-end/src/features/customer/**` wizard. Its only inbound imports come from
  `BookingPage.tsx` *inside the same folder* — nothing outside it references it.
  **Editing it will not change application behaviour.**
- `Front-end/src/services/mockStore.ts` looks like an offline fallback but has
  **zero inbound imports**. Nothing uses it.

**4. Seeded credentials are committed in source.**
`Front-end/src/features/auth/roleAccess.ts` (`LOGIN_ROLE_OPTIONS`) and
`Back-end/src/main/java/com/autowashpro/config/SystemAccountSeeder.java` both ship
STAFF/ADMIN account credentials in tracked files. Treat both as security-sensitive,
do not copy values out of them, and see the open items in `PROGRESS.md`. Per `AGENTS.md`,
deleting a secret is not sufficient — exposed accounts must be rotated.

---

## Project Overview

**AutoWash Pro** is a vehicle-washing booking system with three role-scoped portals —
customer, staff/counter, and admin — sharing one Spring Boot API and one MSSQL database.

| | |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router, Axios, Firebase |
| **Backend** | Spring Boot 3.5.6, Java 17, Spring Web, Spring Data JPA, Spring Security, Hibernate, Lombok, MapStruct, SpringDoc OpenAPI |
| **Database** | MSSQL — 9 core tables |
| **Scale** | 195 files · 167 code files · 63 classes · 172 functions |

### Running it

```bash
# Frontend  (dev server on port 3000)
npm --prefix Front-end ci
npm --prefix Front-end run dev
npm --prefix Front-end run build

# Backend  (no Maven wrapper in this repo — use an installed mvn)
mvn -f Back-end/pom.xml spring-boot:run
mvn -f Back-end/pom.xml test    # NOTE: no test sources exist; this executes zero tests
```

`Back-end/src/main/resources/application.properties` is environment-driven. Datasource
password and JWT secret are read from environment variables — keep them out of Git.

---

## Architecture Layers

Ten layers, ordered entry-point → data. A request flows down 1→9; layer 10 is non-runtime.

| # | Layer | Files | Responsibility |
|---|---|---|---|
| 1 | **Frontend Shell & Routing** | 8 | React entry, App composition, the router tree (root/app/admin), `ProtectedRoute` role guard, customer layout chrome. Where a browser request first lands. |
| 2 | **Frontend Feature Screens** | 39 | Role-scoped screens: customer booking wizard and dashboard, admin panels, the counter portal, and the legacy `pages/booking` variant. |
| 3 | **Frontend Application Logic & Data Access** | 22 | Contexts (auth, theme, booking), booking/pricing hooks, admin feature modules, role-access rules, the Axios instance, Firebase client, and typed service wrappers. |
| 4 | **Shared UI Kit, Types & Utilities** | 12 | Button/Card/Input/Modal/Stepper/Badge/Sidebar primitives, shared domain types, formatters/validators, app constants. |
| 5 | **Backend REST API & DTOs** | 29 | `@RestController` endpoints for auth, customers, vehicles, bookings, loyalty, admin — plus DTOs, MapStruct mappers, the exception hierarchy and global handler. |
| 6 | **Backend Application Services** | 10 | Business logic: auth/OTP, customer and vehicle management, booking management, loyalty, admin campaigns, scheduled loyalty maintenance. |
| 7 | **Backend Domain Model & Persistence** | 20 | JPA entities and Spring Data repositories over MSSQL. |
| 8 | **Backend Platform, Security & Configuration** | 9 | Boot class, Spring Security filter chain, JWT filter/provider, Firebase Admin setup, account seeder, phone normaliser, `pom.xml`, `application.properties`. |
| 9 | **Database Schema & Migrations** | 12 | The MSSQL schema script, FR-driven migrations, and the nine table definitions backing the JPA entities. |
| 10 | **Project Tooling, Verification & Documentation** | 43 | Build config, ad-hoc FR verification scripts, docs, agent guidance, and empty evidence placeholders. |

---

## Key Concepts

**Three portals, one auth context.** `RootRouter` decides which portal a visitor sees based
on auth state, not URL alone. `roleAccess.ts` is the single source of truth for the mapping:
`ADMIN → /admin`, `STAFF → /counter`, `CUSTOMER → /app`, no user → `/login`. When role
behaviour looks wrong, fix it there — not in individual screens.

**Frontend role routing is cosmetic.** Real enforcement is server-side in `SecurityConfig`'s
filter chain plus `JwtAuthenticationFilter`. Never treat a frontend guard as a security control.

**One Axios instance owns all network behaviour.** `config/axios.ts` holds the base URL, the
bearer-token request interceptor, and the 401 response interceptor. Every backend call in the
app inherits from this one file.

**`types/index.ts` is the schema.** With 35 inbound edges it has by far the highest fan-in in
the graph — it is the vocabulary every screen, hook, and service agrees on. A change here
ripples further than a change almost anywhere else. `platform.service.ts` sits just beneath it,
translating backend field names into these types (see `mapBooking`).

**Thin controllers, fat services.** Controllers validate a DTO and delegate.
`BookingManagementService` is the real brain of the booking flow; `GlobalExceptionHandler`
turns the custom exception hierarchy into consistent JSON error shapes the frontend can rely on.

**Loyalty points are an append-only ledger.** `PointHistory` records signed point movements,
written on booking completion. `PointHistoryRepository` supports idempotency checks so a
completion cannot double-award. `LoyaltyMaintenanceScheduler` expires stale points daily and
recomputes tiers.

**Composite keys in the join table.** `BookingService` maps the many-to-many between bookings
and wash services using an embeddable `BookingServiceId` — one booking can include several services.

**Payment integration is not complete.** Payment persistence and the planned provider
scaffolding exist, but no customer action is accepted as verified settlement. Follow the
approved PayOS plan before adding a payment screen or status update route.

---

## Guided Tour

Twelve steps following real import/call edges from browser entry to database and back.

| # | Step | Start here |
|---|---|---|
| 1 | **What AutoWash Pro Is** | `README.md` — but see the stub warning above |
| 2 | **Where The Browser Lands** | `main.tsx` → `RootRouter.tsx` |
| 3 | **Identity And Role Routing** | `AuthContext.tsx`, `roleAccess.ts`, `ProtectedRoute.tsx` |
| 4 | **The Customer Booking Wizard** | `AppRouter.tsx` → `BookingWizardPage.tsx`, `CustomerBookingContext.tsx` |
| 5 | **From Screen To HTTP Call** | `useBookingWizard.ts` → `booking.service.ts` → `config/axios.ts` |
| 6 | **The Shared Type Contract** | `types/index.ts`, `platform.service.ts::mapBooking` |
| 7 | **Crossing Into Spring** | `BookingController.java`, `CreateBookingRequest`, `GlobalExceptionHandler` |
| 8 | **Where The Business Rules Live** | `BookingManagementService.java` — `create` → `resolveVehicle` → `transition` → `complete` |
| 9 | **Entities And Repositories** | `Booking.java`, `BookingRepository.java`, `Customer.java`, `BookingServiceId.java` |
| 10 | **The Physical Schema** | `AutoWashPro.sql` (read, don't execute) + FR migrations |
| 11 | **How Requests Are Actually Authorised** | `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `JwtTokenProvider.java` |
| 12 | **Building, Configuring, Verifying** | `pom.xml`, `application.properties`, `package.json` |

Step 11 deliberately sits *after* the data layer: you need to have seen a full request land
before "and here is what actually authorises it" means anything. The contrast with step 3 is
the point — frontend role routing is cosmetic, server-side enforcement is real.

The tour is also browsable interactively — see *Exploring the graph* below.

---

## File Map

Complexity: **[S]** simple · **[M]** moderate · **[C]** complex.
Abridged to the files you will actually touch; the graph has the full 204.

### Frontend Shell & Routing
| | File | Purpose |
|---|---|---|
| S | `src/main.tsx` | Entry point; mounts React, wraps `RootRouter` in `AuthProvider` + `CustomerBookingProvider` |
| M | `src/routes/RootRouter.tsx` | Top-level `BrowserRouter`; public routes + three role-gated portals |
| M | `src/routes/AppRouter.tsx` | Customer portal router; loads bookings and point transactions |
| C | `src/routes/AdminRouter.tsx` | Admin shell — customers, campaigns, revenue, tiers, vouchers panels |
| S | `src/routes/ProtectedRoute.tsx` | Route guard; redirects unauthenticated or wrong-role users |
| M | `src/App.tsx` | Legacy root component wiring the customer portal |
| M | `src/layouts/CustomerLayout.tsx` | Customer shell: sidebar, responsive mobile menu, header |

### Frontend Feature Screens (selected)
| | File | Purpose |
|---|---|---|
| M | `features/customer/pages/BookingWizardPage.tsx` | Orchestrates the six-step wizard — **the live booking path** |
| C | `features/customer/components/StepServices.tsx` | Service catalogue with live price recalculation |
| C | `features/customer/components/StepConfirmation.tsx` | Reviews draft, applies vouchers, submits booking |
| C | `features/customer/components/VehicleList.tsx` | Vehicle CRUD + set-default |
| C | `features/customer/components/VoucherShop.tsx` | Voucher redemption against point balance |
| C | `features/customer/pages/DashboardPage.tsx` | Aggregates bookings, points, vehicles |
| C | `features/customer/pages/LoginPage.tsx` | Role selector + password login + register/verify-OTP tabs |
| C | `features/admin/pages/AdminCustomerRegistryPage.tsx` | Admin console: customers, bookings, revenue, campaigns |
| C | `features/admin/pages/CampaignBuilderPanel.tsx` | Drafts and publishes loyalty campaigns |
| M | `features/admin/pages/TierManagementPanel.tsx` | ⚠️ **Read-only shell** — controls disabled, no backing API |
| M | `features/admin/pages/VoucherManagementPanel.tsx` | ⚠️ **Read-only shell** — controls disabled, no backing API |
| C | `pages/washing-counter/WashingCounterPage.tsx` | Staff queue by branch/date with status transitions |
| — | `pages/booking/**` | ⚠️ **Dead code** — legacy duplicate wizard, not routed |

### Frontend Application Logic & Data Access
| | File | Purpose |
|---|---|---|
| S | `config/axios.ts` | Shared API client — base URL, bearer interceptor, 401 handling |
| S | `config/firebase-config.ts` | Firebase app init (guards double-init), exports `auth` |
| M | `context/AuthContext.tsx` | Current user, token, derived role; login/register/logout |
| M | `context/CustomerBookingContext.tsx` | Booking draft + step navigation across wizard steps |
| C | `context/BookingContext.tsx` | Legacy wizard state + in-memory mock DB (pairs with dead `pages/booking`) |
| S | `features/auth/roleAccess.ts` | 🔒 Role→portal routing (**ships seeded credentials**) |
| C | `services/platform.service.ts` | Central API client — customer + admin endpoints |
| M | `services/customer/booking.service.ts` | Booking creation, history, slot availability |
| M | `services/customer/catalog.service.ts` | Service/branch catalogues, cached in module scope |
| S | `services/customer/price.service.ts` | Pricing; falls back to static catalogue in `constants.ts` |
| C | `features/admin/adminApi.ts` | Defensive parsing of admin payloads into typed results |
| S | `features/admin/{customerRegistry,bookingLog,revenueAudit,campaignBuilder}.ts` | Pure helpers — filter/sort/paginate/aggregate |
| M | `services/mockStore.ts` | ⚠️ **Dead code** — zero inbound imports |

### Shared UI Kit, Types & Utilities
| | File | Purpose |
|---|---|---|
| M | `types/index.ts` | ⭐ Central domain model — highest fan-in in the repo (35 inbound) |
| M | `config/constants.ts` | Loyalty tiers, car-size multipliers, service categories |
| S | `utils/formatters.ts` / `validators.ts` | VND/date formatting; VN phone, email, plate validation |
| S | `components/{Button,Card,Input,Modal,Stepper,Badge}` | Presentational primitives |
| M | `components/Sidebar/Sidebar.tsx` | Collapsible nav with mobile overlay |

### Backend REST API & DTOs
| | File | Purpose |
|---|---|---|
| M | `controller/BookingController.java` | Catalogs, booking creation, slot availability, transitions |
| M | `controller/AdminController.java` | `/api/v1/admin` — customers, booking log, revenue, campaigns |
| S | `controller/AuthController.java` | Public registration and phone/password login |
| S | `controller/LoyaltyController.java` | `/api/v1/loyalty` — redemption, vouchers, point history |
| M | `controller/VehicleController.java` | Customer-scoped vehicle CRUD + set-default |
| S | `controller/CustomerController.java` | Customer CRUD |
| M | `exception/handler/GlobalExceptionHandler.java` | Maps exceptions → consistent JSON error payloads |
| S | `exception/custom/*.java` | `BadRequest` 400 · `Unauthorized` 401 · `ResourceNotFound` 404 · `Conflict` 409 |
| S | `mapper/{AuthMapper,CustomerMapper}.java` | MapStruct entity↔DTO conversion |

### Backend Application Services
| | File | Purpose |
|---|---|---|
| C | `service/BookingManagementService.java` | ⭐ Core booking brain — create, resolve vehicle, transition, complete |
| C | `service/AdminService.java` | Customer search/update, booking log, revenue aggregation, campaigns |
| C | `service/impl/AuthServiceImpl.java` | Registration/login, phone normalisation, Firebase OTP verify, hashing |
| C | `service/impl/VehicleServiceImpl.java` | Owner-scoped CRUD, plate normalisation, duplicate + single-default rules |
| M | `service/LoyaltyService.java` | Debits points to issue vouchers; reads balances |
| M | `service/LoyaltyMaintenanceScheduler.java` | Daily job — expires stale points, recomputes tiers |

### Backend Domain Model & Persistence
| | File | Purpose |
|---|---|---|
| M | `entity/Customer.java` | ⭐ Domain hub (10 inbound) — identity, hashed credentials, role, loyalty state |
| M | `entity/Booking.java` | Links customer + vehicle + branch; schedule, pricing, status |
| S | `entity/BookingService.java` + `BookingServiceId.java` | Join entity + composite key |
| S | `entity/{Vehicle,Service,Branch,Voucher,PointHistory}.java` | Supporting entities |
| M | `entity/Promotion.java` | Tier-targeted discount campaign |
| S | `repository/*.java` | Spring Data repositories — derived queries, no impl classes |

### Backend Platform, Security & Configuration
| | File | Purpose |
|---|---|---|
| M | `config/SecurityConfig.java` | 🔒 Stateless JWT filter chain, per-portal role URL rules |
| S | `config/JwtAuthenticationFilter.java` | 🔒 Per-request bearer extraction → security context |
| M | `config/JwtTokenProvider.java` | 🔒 Issues/verifies HS256 tokens |
| S | `config/SystemAccountSeeder.java` | 🔒 Seeds STAFF/ADMIN at startup (**ships credentials**) |
| S | `config/FirebaseConfig.java` | Firebase Admin SDK from classpath service account |
| S | `utils/PhoneNormalizer.java` | VN phone → E.164 |
| M | `pom.xml` / `application.properties` | Java 17 + Boot 3.5.6; env-driven config |

### Database Schema & Migrations
| | File | Purpose |
|---|---|---|
| C | `database/AutoWashPro.sql` | Full MSSQL schema — 9 tables: `customers`, `vehicles`, `bookings`, `services`, `booking_services`, `branches`, `vouchers`, `promotions`, `point_history` |
| S | `database/FR001_FR013_upgrade_migration.sql` | Idempotent upgrade — adds `customers.role` etc. |
| S | `database/FR004_booking_duration_migration.sql` | Adds `end_time` + `duration_minutes`, backfills |

---

## Complexity Hotspots

24 of 204 file-level nodes are rated **complex**. Approach these carefully.

**Read before you change anything**
1. `BookingManagementService.java` — the booking brain. Creation, vehicle resolution, schedule
   validation, the status machine, and loyalty point awards all live here.
2. `types/index.ts` — highest fan-in in the repo; changes ripple everywhere.
3. `platform.service.ts` — central API client for both customer and admin surfaces.
4. `AutoWashPro.sql` — the schema every entity maps onto.

**Security-sensitive — review before touching** 🔒
5. `AuthServiceImpl.java` — registration/login, OTP verification, password hashing.
6. `SecurityConfig.java` + `JwtAuthenticationFilter.java` + `JwtTokenProvider.java` — the only
   real access control in the system.
7. `SystemAccountSeeder.java`, `roleAccess.ts` — committed credentials.
8. `AdminService.java` — all admin business logic in one transactional class.

**Large UI surfaces**
9. `AdminCustomerRegistryPage.tsx` — tabs, search, filtering, sorting, infinite scroll.
10. `adminApi.ts` — defensive normalisation of loosely-typed backend payloads.
11. The `complex` booking wizard steps: `StepServices`, `StepConfirmation`, `StepPayment`,
    `VehicleList`, `VoucherShop`.

**Don't waste time here** — `pages/booking/**` (`StepContact`, `StepServices`), 
`pages/dashboard/CustomerDashboard.tsx`, and `context/BookingContext.tsx` are rated complex
but sit on the dead legacy path.

---

## Suggested First Week

1. **Day 1** — Run both apps. Read `README.md`. Walk tour steps 1–3; confirm you can log in
   and land in the right portal per role.
2. **Day 2** — Tour steps 4–6. Trace one booking from `BookingWizardPage` to the Axios call.
   Read `types/index.ts` end to end.
3. **Day 3** — Tour steps 7–10. Follow the same booking into `BookingController`,
   `BookingManagementService`, the repositories, and the `bookings` table.
4. **Day 4** — Tour step 11. Map which endpoints are public vs role-gated in `SecurityConfig`.
5. **Day 5** — Pick a small FR from `docs/testing/RUN-AND-TEST-FR001-FR013.md` and verify it by
   hand. Note there is no automated test to lean on.

---

## Exploring the graph

```bash
/understand-dashboard        # interactive graph + guided tour
/understand-explain <file>   # deep dive on one file
/understand-chat             # ask questions against the graph
/understand-domain           # business-domain flow view (already generated)
/understand                  # regenerate after significant code changes
```

Artifacts live in `.ua/`: `knowledge-graph.json`, `domain-graph.json` (6 domains, 21 flows,
90 steps), `fingerprints.json`, `meta.json`.

---

*Generated by `/understand-onboard`. Regenerate after significant architectural change —
this guide is only as current as the graph it was built from.*
