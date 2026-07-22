package com.autowashpro.service;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ExpiredSlotHoldCleanupJobTest {

    @Test
    void expirePendingDeposits_capturesOneVietnamWallTimeAndDelegatesToWorker() {
        BookingLifecycleExpiryService expiry = mock(BookingLifecycleExpiryService.class);
        Clock clock = Clock.fixed(Instant.parse("2026-07-22T01:00:00Z"), ZoneOffset.UTC);
        LocalDateTime vietnamNow = LocalDateTime.of(2026, 7, 22, 8, 0);
        when(expiry.expireDue(vietnamNow, 100)).thenReturn(3);

        int expired = new ExpiredSlotHoldCleanupJob(expiry, clock, 100)
                .expirePendingDeposits();

        assertThat(expired).isEqualTo(3);
        verify(expiry).expireDue(vietnamNow, 100);
    }
}
