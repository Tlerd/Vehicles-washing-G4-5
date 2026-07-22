package com.autowashpro.repository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class BookingEngineSchemaIntegrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void phase3ColumnsAndIndexes_existOnSqlServer() {
        assertColumns("services", List.of(
                "is_size_dependent", "pricing_unit", "booking_mode",
                "buffer_minutes", "required_bay_type", "booking_configured"));
        assertColumns("branches", List.of(
                "booking_enabled", "booking_notice", "slot_minutes",
                "min_advance_slot_minutes", "min_advance_flexible_minutes"));
        assertColumns("bookings", List.of(
                "guest_license_plate", "guest_vehicle_brand", "guest_vehicle_size",
                "booking_mode", "subtotal", "size_adjustment", "voucher_discount", "deposit_amount",
                "paid_amount", "counter_balance", "deposit_expires_at", "note"));
        assertColumns("bookings", List.of("legacy_financial_snapshot"));
        assertColumns("customers", List.of("no_show_count", "requires_full_prepay"));
        assertColumns("vouchers", List.of("min_tier", "min_tier_id"));
        assertColumns("guests", List.of("vehicle_brand"));
        assertColumns("idempotency_records", List.of("request_hash", "principal_scope_hash"));
        assertColumns("tiers", List.of(
                "tier_id", "tier_code", "tier_rank", "booking_window_days",
                "points_multiplier", "deposit_waived"));
        assertColumns("bays", List.of("is_active"));

        List<String> tierCodes = jdbc.queryForList(
                "SELECT tier_code FROM dbo.tiers", String.class);
        assertThat(tierCodes).contains("MEMBER", "SILVER", "GOLD", "PLATINUM");

        String vehicleNullable = jdbc.queryForObject("""
                SELECT is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'dbo' AND table_name = 'bookings'
                  AND column_name = 'vehicle_id'
                """, String.class);
        assertThat(vehicleNullable).isEqualTo("YES");

        List<String> slotIndexes = jdbc.queryForList("""
                SELECT name
                FROM sys.indexes
                WHERE object_id = OBJECT_ID('dbo.slot_reservations')
                """, String.class);
        assertThat(slotIndexes).contains("IX_slot_lookup", "IX_slot_expiry");

        List<String> bayIndexes = jdbc.queryForList("""
                SELECT name FROM sys.indexes
                WHERE object_id = OBJECT_ID('dbo.bays')
                """, String.class);
        assertThat(bayIndexes).contains("IX_bays_allocation");

        List<String> bookingIndexes = jdbc.queryForList("""
                SELECT name FROM sys.indexes
                WHERE object_id = OBJECT_ID('dbo.bookings')
                """, String.class);
        assertThat(bookingIndexes).contains("IX_bookings_legacy_availability");

        List<String> foreignKeys = jdbc.queryForList("""
                SELECT name FROM sys.foreign_keys
                WHERE parent_object_id IN (
                    OBJECT_ID('dbo.slot_reservations'), OBJECT_ID('dbo.vouchers'),
                    OBJECT_ID('dbo.bookings')
                )
                """, String.class);
        assertThat(foreignKeys).contains(
                "FK_slot_reservations_bay_branch", "FK_vouchers_min_tier",
                "FK_bookings_vehicle_owner", "FK_slot_reservations_booking_branch");

        Integer unsafeForeignKeys = jdbc.queryForObject("""
                SELECT COUNT(*) FROM sys.foreign_keys
                WHERE name IN (
                    'FK_slot_reservations_bay_branch',
                    'FK_slot_reservations_booking_branch',
                    'FK_vouchers_min_tier',
                    'FK_bookings_vehicle_owner'
                ) AND (is_not_trusted = 1 OR is_disabled = 1)
                """, Integer.class);
        assertThat(unsafeForeignKeys).isZero();

        List<String> trustedChecks = jdbc.queryForList("""
                SELECT name FROM sys.check_constraints
                WHERE is_not_trusted = 0 AND name IN (
                    'CK_bookings_payment_amounts',
                    'CK_bookings_vehicle_by_actor',
                    'CK_idempotency_records_key_digest'
                )
                """, String.class);
        assertThat(trustedChecks).containsExactlyInAnyOrder(
                "CK_bookings_payment_amounts",
                "CK_bookings_vehicle_by_actor",
                "CK_idempotency_records_key_digest");

        List<String> trustedSlotChecks = jdbc.queryForList("""
                SELECT name FROM sys.check_constraints
                WHERE is_not_trusted = 0 AND is_disabled = 0 AND name IN (
                    'CK_slot_reservations_grid',
                    'CK_slot_reservations_expiry'
                )
                """, String.class);
        assertThat(trustedSlotChecks).containsExactlyInAnyOrder(
                "CK_slot_reservations_grid", "CK_slot_reservations_expiry");
    }

    private void assertColumns(String table, List<String> expectedColumns) {
        List<String> actual = jdbc.queryForList("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = 'dbo' AND table_name = ?
                """, String.class, table);
        assertThat(actual).containsAll(expectedColumns);
    }
}
