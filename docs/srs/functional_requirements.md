# Functional Requirements Index: AutoWash Pro v2

This index identifies the v2 requirement set. Detailed behaviour is defined by the matching FR file and the referenced v2 rule documents.

| ID | Requirement | Area | Estimate (days) | Priority | Detail |
| --- | --- | --- | ---: | --- | --- |
| FR-001 | Registration and identity verification | foundation | 3 | high | [FR-001](FR-001-customer-registration-otp.md) |
| FR-002 | Login and account linking | foundation | 2 | high | [FR-002](FR-002-customer-login.md) |
| FR-003 | Vehicle CRUD management | foundation | 3 | medium | [FR-003](FR-003-vehicle-crud-management.md) |
| FR-004 | Six-step booking wizard | foundation | 5 | high | [FR-004](FR-004-booking-wizard-navigation.md) |
| FR-005 | VNPAY deposit checkout | foundation | 3 | high | [FR-005](FR-005-booking-checkout-vietqr-payment.md) |
| FR-006 | Loyalty point accumulation | reporting | 2 | high | [FR-006](FR-006-loyalty-point-accumulation.md) |
| FR-007 | Tier upgrade and expiration | reporting | 3 | high | [FR-007](FR-007-loyalty-tier-upgrade-expiration.md) |
| FR-008 | Voucher redemption and lifecycle | reporting | 3 | medium | [FR-008](FR-008-rewards-redemption-vouchers.md) |
| FR-009 | Counter queue operations | reporting | 4 | high | [FR-009](FR-009-washing-counter-queue-operations.md) |
| FR-010 | Admin directories | exceptions | 4 | medium | [FR-010](FR-010-admin-customer-directory.md) |
| FR-011 | Admin booking management | exceptions | 3 | low | [FR-011](FR-011-admin-booking-infinite-scroll.md) |
| FR-012 | Revenue statistics and audit logs | exceptions | 4 | medium | [FR-012](FR-012-admin-income-statistics-logs.md) |
| FR-013 | Campaign promotion builder | exceptions | 4 | low | [FR-013](FR-013-campaign-promotion-builder.md) |

Estimated total remains **43 developer days**; see [effort chart](fr-effort-chart.md). The authoritative cross-cutting rules are [the v2 flow](../refactor/01-LUONG-CHAY-MOI.md), [business rules](../refactor/06-BUSINESS-RULES-V2.md), and [admin specification](../refactor/07-ADMIN-SPEC.md).
