# Technical Specification: [FR-007] Loyalty Tier Upgrade & Expiration Reviews

This document specifies the technical design, requirements, and BDD verification scenarios for membership tier evaluations (upgrades/downgrades) and points/wash expirations using rolling 12-month metrics.

*   **Parent Epic**: `EPIC: FR-001..FR-013 Delivery`
*   **Milestone**: Release 1.0
*   **Priority**: `priority:high`
*   **Estimate**: 3 days
*   **Functional Area**: `area:reporting`

---

## 1. Functional & Business Logic Analysis

### 1.1. Granular Operations (CRUD Matrix)
*   **Create**: None.
*   **Read**: Query historical bookings and spent totals within the rolling 365-day range.
*   **Update**: Modify the customer's membership tier (`Member`, `Silver`, `Gold`, `Platinum`) in the database.
*   **Delete**: None.

### 1.2. Business Rules & Constraints
*   **Rolling 12-Month Sizing (BR-005)**: Evaluations aggregate data from the past 12 months (365 days).
*   **Tier Thresholds**:
    *   **Silver**: $\ge 5$ washes OR $\ge 2,000,000$ VND spend.
    *   **Gold**: $\ge 15$ washes OR $\ge 6,000,000$ VND spend.
    *   **Platinum**: $\ge 30$ washes OR $\ge 15,000,000$ VND spend.
*   **Upgrade Triggers**: Evaluated in real-time immediately after checkout of any completed wash.
*   **Downgrade Scheduler (BR-007)**: Automated job runs on the **1st of every month** at 00:00.
*   **Points Expiration (BR-008)**: Points earned from any transaction expire 12 months (365 days) from the earn date.

### 1.3. Role-Based Access Control (RBAC)
*   **Authorized Roles**: System background scheduler and transaction event triggers.

---

## 2. Front-end Specifications (FE)

### 2.1. UI/UX Layout & Wireframe Concept
*   **Layout**: Displays at the top of the "Loyalty & Points" tab in [CustomerDashboard.tsx](file:///d:/demoSWP/Vehicles-washing-G4-5/Front-end/src/pages/dashboard/CustomerDashboard.tsx).
*   **Wireframe (Tier Progress Bar)**:
    ```text
    +---------------------------------------------------------------+
    | Silver Tier Member                                            |
    | [██████████████████████░░░░░░░░░░░] 60%                       |
    | Need 4 washes or 450k VND spent to reach Gold.                |
    | Points Expiring Next Month: 120 points                        |
    +---------------------------------------------------------------+
    ```

### 2.2. Components & Interactive Controls
*   **Progress Bar**: Renders completion percentage based on washes or spent totals (whichever metric is closer to the next threshold).

---

## 3. Back-end Specifications (BE)

### 3.1. API Contract
*   *Note*: This logic runs implicitly. No public REST endpoint allows tier modification. Database logs are accessible via the admin audit logs endpoint.

### 3.2. scheduled jobs
*   **Spring Boot Scheduler**:
    ```java
    @Scheduled(cron = "0 0 0 1 * *") // Runs 1st of every month at midnight
    public void runMonthlyTierDowngradeReview() { ... }

    @Scheduled(cron = "0 0 0 * * *") // Runs daily at midnight to expire points
    public void runDailyPointExpirationReview() { ... }
    ```

---

## 4. Acceptance Criteria (AC)

### AC-1: Real-time Tier Upgrade (Happy Path)
*   **Given** a Customer has `Member` tier and has completed 4 washes in the last 10 months.
*   **When** their 5th wash transaction completes and is checked out.
*   **Then** the system must calculate the cumulative washes ($5$), verify it meets the Silver threshold, and instantly update `customer.tier = 'Silver'` in the database.
*   **And** subsequent bookings must apply the 1.1x points multiplier.

### AC-2: Monthly Review Downgrade (Happy Path)
*   **Given** it is the 1st of the month.
*   **And** a customer currently holds `Silver` tier.
*   **And** 2 of their washes occur older than 365 days, dropping their rolling washes to 3.
*   **And** their rolling spent total is under 2M VND.
*   **When** the monthly downgrade scheduler runs.
*   **Then** the system must update their tier to `Member`.

### AC-3: Wash Status Filter Constraint (Edge Case)
*   **Given** a customer has 4 completed washes and 1 pending booking.
*   **When** the tier evaluation engine aggregates washes.
*   **Then** it must ignore the pending booking.
*   **And** the customer remains at the `Member` tier.

### AC-4: Points Expiration Log (Edge Case)
*   **Given** a customer earned 150 points on June 24, 2025.
*   **When** the date rolls to June 25, 2026.
*   **Then** the daily scheduler must deduct 150 points from their balance.
*   **And** append an `EXPIRE` transaction log.
