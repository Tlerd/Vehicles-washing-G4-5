package com.autowashpro.dto.booking;

import java.time.LocalTime;

/** Temporary shape retained until the rebuilt frontend switches to the branch-slot contract. */
public record LegacyAvailabilitySlotResponse(
        LocalTime time,
        LocalTime endTime,
        int durationMinutes,
        boolean available
) {
}
