package com.autowashpro.repository;

import com.autowashpro.entity.SlotReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SlotReservationRepository extends JpaRepository<SlotReservation, Long> {

    List<SlotReservation> findByBayBayIdAndSlotTimeBetween(Long bayId, LocalDateTime from, LocalDateTime to);

    List<SlotReservation> findByBookingBookingId(Long bookingId);
}
