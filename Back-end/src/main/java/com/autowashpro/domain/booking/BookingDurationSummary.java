package com.autowashpro.domain.booking;

public record BookingDurationSummary(
        BookingMode bookingMode,
        int workMinutes,
        int bufferMinutes,
        int occupiedMinutes,
        int requiredSlots,
        int reservedMinutes
) {
}
