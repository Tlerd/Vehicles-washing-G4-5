# FR/API Completion Audit — 2026-07-23

## Scope

Read-only audit of the complete AutoWash Pro repository against the approved
v2 functional requirements FR-001 through FR-013, the v2 flow and admin
designs, current backend route graph, frontend API usage, recorded tests, and
security evidence. The lecturer's original rubric is not present, so these
figures are capability estimates rather than rubric scores.

## Method

Each FR was scored using reachable API behavior, contract compatibility,
authorization/persistence/business-rule integrity, and verification evidence.
Plans, DTOs, entities, migrations, UI shells, and passing isolated tests were
not counted as complete behavior when the corresponding API flow was absent.

## Findings

| FR | Capability estimate | Summary |
|---|---:|---|
| FR-001 | 85% | Registration, Firebase verification, duplicate handling, and approved Google deviation are implemented. |
| FR-002 | 85% | Phone/password JWT login is implemented per the approved deviation. |
| FR-003 | 75% | Owner-scoped vehicle CRUD exists; PUT/PATCH mismatch and staff correction/guest temporary flow remain. |
| FR-004 | 55% | Catalog and trusted availability are strong; full guest and transactional booking creation remain incomplete. |
| FR-005 | 15% | Payment persistence/scaffolding exists, but VNPAY/settlement APIs and authoritative payment lifecycle are absent. |
| FR-006 | 25% | Legacy completion credit exists, but lifecycle/payment/guest coupling is incomplete. |
| FR-007 | 20% | Scheduled maintenance exists; complete tier qualification and expiration semantics are not connected to v2 completion. |
| FR-008 | 35% | Basic redemption exists; route mismatch, locking, usage/restoration, tier checks, and atomicity remain. |
| FR-009 | 25% | Queue/status surface exists, but role-owned start/finish/confirmation APIs are missing. |
| FR-010 | 15% | Limited customer admin surface; staff/guest directory and lifecycle APIs are absent. |
| FR-011 | 15% | Basic booking listing exists; reschedule/override/audit/notification workflow is absent. |
| FR-012 | 15% | Basic revenue/audit-shaped endpoints exist; approved reports, timezone rules, and real audit logs are incomplete. |
| FR-013 | 35% | Basic campaign CRUD exists; complete promotion lifecycle, audit, UI, and loyalty integration are incomplete. |

Equal-weight capability estimate: **40.0%**. Backend REST estimate from the
separate endpoint/behavior audit: **43.1%**. Evidence confidence is materially
lower for FR-005 through FR-013 because the current behavioral evidence is
concentrated in FR-001 through FR-004; this is not the same metric as capability
completion.

## Critical findings

- STAFF can submit an arbitrary washing-counter status and reach `COMPLETED`,
  which can trigger loyalty credit; this violates FR-009 and affects FR-006/007.
- FR-005 payment creation, VNPAY IPN, return, and payment authority APIs are
  absent. Existing payment entities/services are not reachable behavior.
- Voucher redemption performs a non-atomic balance check/decrement and is
  vulnerable to concurrent double redemption.
- Login and registration have no API throttling; duplicate registration
  responses also expose an enumeration signal.
- Vehicle request DTOs/controllers bypass bean validation.
- The frontend stores JWTs in localStorage.
- The Firebase service-account file remains a local classpath resource and must
  not enter build/deployment artifacts; rotate it if it was exposed.

## Verification evidence

- Codebase-memory index refreshed successfully: 4,145 nodes and 12,014 edges.
- Recorded backend evidence: `Back-end/run-tests.ps1 -Clean` passed 184/184 on
  2026-07-22 against the isolated SQL Server test database; this does not prove
  all FR APIs are implemented.
- Recorded frontend evidence: `npm --prefix Front-end run typecheck` and
  `npm --prefix Front-end run build` passed; no frontend test script exists.
- No new behavioral tests were run during this audit; findings are read-only
  and evidence-backed by source, existing logs, and recorded commands.

## Recommended order

1. Decide the normative payment provider (FR says VNPAY; active draft work also
   references PayOS).
2. Complete transactional member/guest booking creation, holds, idempotency,
   expiry, and payment-gated lifecycle.
3. Replace generic counter status mutation with role-owned lifecycle endpoints.
4. Couple completion to loyalty, tiers, vouchers, guest exclusion, and audit.
5. Implement admin directories, rescheduling, reports, audit, and campaigns.
6. Replace frontend mock customer APIs and build admin parity.

