package com.autowashpro.service;

import com.autowashpro.repository.SlotReservationRepository;
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
    void releaseExpiredHolds_usesVietnamWallTimeAndReturnsDeletedCount() {
        SlotReservationRepository reservations = mock(SlotReservationRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-07-22T01:00:00Z"), ZoneOffset.UTC);
        LocalDateTime vietnamNow = LocalDateTime.of(2026, 7, 22, 8, 0);
        when(reservations.deleteExpiredHolds(vietnamNow)).thenReturn(3);

        int deleted = new ExpiredSlotHoldCleanupJob(reservations, clock).releaseExpiredHolds();

        assertThat(deleted).isEqualTo(3);
        verify(reservations).deleteExpiredHolds(vietnamNow);
    }
}
