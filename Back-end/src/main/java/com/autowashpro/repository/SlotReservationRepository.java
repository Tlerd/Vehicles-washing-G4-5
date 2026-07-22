package com.autowashpro.repository;

import com.autowashpro.entity.SlotReservation;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SlotReservationRepository extends JpaRepository<SlotReservation, Long> {

    interface BlockingSlotProjection {
        Long getBayId();
        Long getBookingId();
        LocalDateTime getSlotTime();
    }

    List<SlotReservation> findByBayBayIdAndSlotTimeBetween(Long bayId, LocalDateTime from, LocalDateTime to);

    List<SlotReservation> findByBookingBookingId(Long bookingId);

    @Query("""
            SELECT r.bay.bayId AS bayId, r.booking.bookingId AS bookingId, r.slotTime AS slotTime
            FROM SlotReservation r
            WHERE r.branch.branchId = :branchId
              AND r.slotTime >= :from
              AND r.slotTime < :to
              AND r.status IN ('BOOKED', 'HOLD')
            """)
    List<BlockingSlotProjection> findBlockingSlots(
            @Param("branchId") Long branchId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query(value = "SELECT * FROM dbo.slot_reservations " +
            "WITH (UPDLOCK, ROWLOCK, INDEX(IX_slot_booking_lock)) " +
            "WHERE booking_id = :bookingId ORDER BY slot_time, reservation_id",
            nativeQuery = true)
    @QueryHints(@QueryHint(name = "jakarta.persistence.query.timeout", value = "2000"))
    List<SlotReservation> findByBookingIdForUpdate(@Param("bookingId") Long bookingId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM SlotReservation r WHERE r.booking.bookingId = :bookingId " +
            "AND r.status = 'HOLD'")
    int deleteHoldsByBookingId(@Param("bookingId") Long bookingId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE SlotReservation r SET r.status = 'BOOKED', r.expiresAt = NULL " +
            "WHERE r.booking.bookingId = :bookingId AND r.status = 'HOLD'")
    int confirmHoldsByBookingId(@Param("bookingId") Long bookingId);
}
