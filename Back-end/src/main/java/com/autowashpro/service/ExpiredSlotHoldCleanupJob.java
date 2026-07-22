package com.autowashpro.service;

import com.autowashpro.repository.SlotReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class ExpiredSlotHoldCleanupJob {

    private final SlotReservationRepository reservations;
    private final Clock clock;

    @Autowired
    public ExpiredSlotHoldCleanupJob(SlotReservationRepository reservations) {
        this(reservations, Clock.systemUTC());
    }

    ExpiredSlotHoldCleanupJob(SlotReservationRepository reservations, Clock clock) {
        this.reservations = reservations;
        this.clock = clock;
    }

    @Scheduled(
            initialDelayString = "${autowash.booking.hold-cleanup-initial-delay-ms:60000}",
            fixedDelayString = "${autowash.booking.hold-cleanup-delay-ms:60000}")
    @Transactional
    public int releaseExpiredHolds() {
        LocalDateTime now = LocalDateTime.ofInstant(
                clock.instant(), BookingAvailabilityService.BUSINESS_ZONE);
        return reservations.deleteExpiredHolds(now);
    }
}
