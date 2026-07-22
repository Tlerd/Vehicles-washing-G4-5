package com.autowashpro.dto.booking;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BookingItemSelection(
        @NotNull @Positive Long serviceId,
        @NotNull @Min(1) @Max(20) Integer quantity) implements StrictBookingJsonInput {
}
