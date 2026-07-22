package com.autowashpro.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class ExpiredSlotHoldCleanupJob {

    private static final int DEFAULT_BATCH_SIZE = 100;

    private final BookingLifecycleExpiryService expiry;
    private final Clock clock;
    private final int batchSize;

    @Autowired
    public ExpiredSlotHoldCleanupJob(BookingLifecycleExpiryService expiry) {
        this(expiry, Clock.systemUTC(), DEFAULT_BATCH_SIZE);
    }

    ExpiredSlotHoldCleanupJob(
            BookingLifecycleExpiryService expiry, Clock clock, int batchSize) {
        this.expiry = expiry;
        this.clock = clock;
        this.batchSize = batchSize;
    }

    @Scheduled(
            initialDelayString = "${autowash.booking.hold-cleanup-initial-delay-ms:60000}",
            fixedDelayString = "${autowash.booking.hold-cleanup-delay-ms:60000}")
    public int expirePendingDeposits() {
        LocalDateTime now = LocalDateTime.ofInstant(
                clock.instant(), BookingAvailabilityService.BUSINESS_ZONE);
        return expiry.expireDue(now, batchSize);
    }
}
