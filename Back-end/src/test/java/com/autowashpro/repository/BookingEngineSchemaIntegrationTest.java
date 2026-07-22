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
        assertColumns("bookings", List.of(
                "legacy_financial_snapshot", "assigned_bay_id",
                "active_customer_guard", "active_guest_guard"));
        assertColumns("customers", List.of("no_show_count", "requires_full_prepay"));
        assertColumns("vouchers", List.of("min_tier", "min_tier_id", "locked_booking_id"));
        assertColumns("guests", List.of("vehicle_brand"));
        assertColumns("idempotency_records", List.of(
                "request_hash", "principal_scope_hash", "client_key_hash", "guest_proof_hash"));
        assertColumns("idempotency_guest_proofs", List.of(
                "proof_hash", "idempotency_key", "created_at"));
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
        assertThat(bookingIndexes).contains(
                "IX_bookings_legacy_availability",
                "UX_bookings_active_customer", "UX_bookings_active_guest",
                "UQ_bookings_assignment", "UQ_bookings_voucher_lock");

        Integer validActiveOwnerIndexes = jdbc.queryForObject("""
                SELECT COUNT(*) FROM sys.indexes
                WHERE object_id = OBJECT_ID('dbo.bookings')
                  AND name IN ('UX_bookings_active_customer', 'UX_bookings_active_guest')
                  AND is_unique = 1 AND is_disabled = 0 AND filter_definition IS NULL
                """, Integer.class);
        assertThat(validActiveOwnerIndexes).isEqualTo(2);

        Integer validActiveOwnerGuards = jdbc.queryForObject("""
                SELECT COUNT(*) FROM sys.computed_columns
                WHERE object_id = OBJECT_ID('dbo.bookings')
                  AND name IN ('active_customer_guard', 'active_guest_guard')
                  AND is_persisted = 1
                  AND REPLACE(REPLACE(REPLACE(LOWER(definition), ' ', ''), '[', ''), ']', '')
                      LIKE '%else-booking_id%'
                """, Integer.class);
        assertThat(validActiveOwnerGuards).isEqualTo(2);

        List<String> bookingUniqueKeyColumns = jdbc.queryForList("""
                SELECT key_constraint.name + ':' + CONVERT(varchar(10), index_column.key_ordinal)
                       + ':' + column_metadata.name
                FROM sys.key_constraints key_constraint
                JOIN sys.index_columns index_column
                  ON index_column.object_id = key_constraint.parent_object_id
                 AND index_column.index_id = key_constraint.unique_index_id
                JOIN sys.columns column_metadata
                  ON column_metadata.object_id = index_column.object_id
                 AND column_metadata.column_id = index_column.column_id
                WHERE key_constraint.parent_object_id = OBJECT_ID('dbo.bookings')
                  AND key_constraint.name IN ('UQ_bookings_assignment', 'UQ_bookings_voucher_lock')
                ORDER BY key_constraint.name, index_column.key_ordinal
                """, String.class);
        assertThat(bookingUniqueKeyColumns).containsExactly(
                "UQ_bookings_assignment:1:booking_id",
                "UQ_bookings_assignment:2:branch_id",
                "UQ_bookings_assignment:3:assigned_bay_id",
                "UQ_bookings_voucher_lock:1:booking_id",
                "UQ_bookings_voucher_lock:2:applied_voucher_id");

        List<String> bookingItemIndexes = jdbc.queryForList("""
                SELECT name FROM sys.indexes
                WHERE object_id = OBJECT_ID('dbo.booking_items')
                """, String.class);
        assertThat(bookingItemIndexes).contains("UX_booking_items_booking_service");

        List<String> idempotencyIndexes = jdbc.queryForList("""
                SELECT name FROM sys.indexes
                WHERE object_id = OBJECT_ID('dbo.idempotency_records')
                """, String.class);
        assertThat(idempotencyIndexes).contains(
                "UX_idempotency_actor_key", "IX_idempotency_guest_replay", "IX_idempotency_expiry");

        Integer validGuestReplayIndex = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM sys.indexes index_metadata
                WHERE index_metadata.object_id = OBJECT_ID('dbo.idempotency_records')
                  AND index_metadata.name = 'IX_idempotency_guest_replay'
                  AND index_metadata.is_unique = 1
                  AND index_metadata.is_disabled = 0
                  AND index_metadata.filter_definition IS NOT NULL
                  AND 1 = (
                      SELECT COUNT(*) FROM sys.index_columns index_column
                      JOIN sys.columns column_metadata
                        ON column_metadata.object_id = index_column.object_id
                       AND column_metadata.column_id = index_column.column_id
                      WHERE index_column.object_id = index_metadata.object_id
                        AND index_column.index_id = index_metadata.index_id
                        AND index_column.key_ordinal > 0
                        AND column_metadata.name = 'guest_proof_hash'
                  )
                """, Integer.class);
        assertThat(validGuestReplayIndex).isEqualTo(1);

        List<String> guestProofIndexes = jdbc.queryForList("""
                SELECT name FROM sys.indexes
                WHERE object_id = OBJECT_ID('dbo.idempotency_guest_proofs')
                """, String.class);
        assertThat(guestProofIndexes).contains(
                "PK_idempotency_guest_proofs", "IX_idempotency_guest_proofs_record");

        List<String> foreignKeys = jdbc.queryForList("""
                SELECT name FROM sys.foreign_keys
                WHERE parent_object_id IN (
                    OBJECT_ID('dbo.slot_reservations'), OBJECT_ID('dbo.vouchers'),
                    OBJECT_ID('dbo.bookings'), OBJECT_ID('dbo.idempotency_guest_proofs')
                )
                """, String.class);
        assertThat(foreignKeys).contains(
                "FK_slot_reservations_bay_branch", "FK_vouchers_min_tier",
                "FK_bookings_vehicle_owner", "FK_slot_reservations_booking_branch",
                "FK_bookings_assigned_bay_branch",
                "FK_slot_reservations_booking_assignment",
                "FK_vouchers_locked_booking",
                "FK_idempotency_guest_proofs_record");

        Integer unsafeForeignKeys = jdbc.queryForObject("""
                SELECT COUNT(*) FROM sys.foreign_keys
                WHERE name IN (
                    'FK_slot_reservations_bay_branch',
                    'FK_slot_reservations_booking_branch',
                    'FK_slot_reservations_booking_assignment',
                    'FK_vouchers_min_tier',
                    'FK_bookings_vehicle_owner',
                    'FK_bookings_assigned_bay_branch',
                    'FK_vouchers_locked_booking',
                    'FK_idempotency_guest_proofs_record'
                ) AND (is_not_trusted = 1 OR is_disabled = 1)
                """, Integer.class);
        assertThat(unsafeForeignKeys).isZero();

        List<String> compositeForeignKeyColumns = jdbc.queryForList("""
                SELECT foreign_key.name + ':' + CONVERT(varchar(10), foreign_key_column.constraint_column_id)
                       + ':' + parent_column.name + '->' + referenced_column.name
                FROM sys.foreign_keys foreign_key
                JOIN sys.foreign_key_columns foreign_key_column
                  ON foreign_key_column.constraint_object_id = foreign_key.object_id
                JOIN sys.columns parent_column
                  ON parent_column.object_id = foreign_key.parent_object_id
                 AND parent_column.column_id = foreign_key_column.parent_column_id
                JOIN sys.columns referenced_column
                  ON referenced_column.object_id = foreign_key.referenced_object_id
                 AND referenced_column.column_id = foreign_key_column.referenced_column_id
                WHERE foreign_key.name IN (
                    'FK_slot_reservations_booking_assignment', 'FK_vouchers_locked_booking'
                )
                ORDER BY foreign_key.name, foreign_key_column.constraint_column_id
                """, String.class);
        assertThat(compositeForeignKeyColumns).containsExactly(
                "FK_slot_reservations_booking_assignment:1:booking_id->booking_id",
                "FK_slot_reservations_booking_assignment:2:branch_id->branch_id",
                "FK_slot_reservations_booking_assignment:3:bay_id->assigned_bay_id",
                "FK_vouchers_locked_booking:1:locked_booking_id->booking_id",
                "FK_vouchers_locked_booking:2:voucher_id->applied_voucher_id");

        List<String> trustedChecks = jdbc.queryForList("""
                SELECT name FROM sys.check_constraints
                WHERE is_not_trusted = 0 AND is_disabled = 0 AND name IN (
                    'CK_bookings_payment_amounts',
                    'CK_bookings_vehicle_by_actor',
                    'CK_idempotency_records_key_digest',
                    'CK_bookings_status_v2',
                    'CK_bookings_pending_expiry',
                    'CK_bookings_assignment',
                    'CK_bookings_guard_ids',
                    'CK_booking_items_v2',
                    'CK_vouchers_lock_state',
                    'CK_idempotency_actor',
                    'CK_idempotency_hashes',
                    'CK_idempotency_expiry',
                    'CK_idempotency_guest_proof_hash'
                )
                """, String.class);
        assertThat(trustedChecks).containsExactlyInAnyOrder(
                "CK_bookings_payment_amounts",
                "CK_bookings_vehicle_by_actor",
                "CK_idempotency_records_key_digest",
                "CK_bookings_status_v2",
                "CK_bookings_pending_expiry",
                "CK_bookings_assignment",
                "CK_bookings_guard_ids",
                "CK_booking_items_v2",
                "CK_vouchers_lock_state",
                "CK_idempotency_actor",
                "CK_idempotency_hashes",
                "CK_idempotency_expiry",
                "CK_idempotency_guest_proof_hash");

        List<String> computedColumns = jdbc.queryForList("""
                SELECT name FROM sys.computed_columns
                WHERE object_id = OBJECT_ID('dbo.bookings') AND is_persisted = 1
                """, String.class);
        assertThat(computedColumns).contains(
                "active_customer_guard", "active_guest_guard");

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
