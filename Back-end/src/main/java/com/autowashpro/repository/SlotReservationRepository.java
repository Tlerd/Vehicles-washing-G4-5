package com.autowashpro.repository;

import com.autowashpro.entity.SlotReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
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
              AND (r.status = 'BOOKED'
                   OR (r.status = 'HOLD' AND (r.expiresAt IS NULL OR r.expiresAt > :now)))
            """)
    List<BlockingSlotProjection> findBlockingSlots(
            @Param("branchId") Long branchId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM SlotReservation r WHERE r.status = 'HOLD' AND r.expiresAt <= :now")
    int deleteExpiredHolds(@Param("now") LocalDateTime now);
}
