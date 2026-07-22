package com.autowashpro.domain.booking;

import java.math.BigDecimal;

/** Server-derived service catalog values plus the validated requested quantity. */
public record TrustedBookingItem(
        Long serviceId,
        BigDecimal basePrice,
        boolean sizeDependent,
        PricingUnit pricingUnit,
        BookingMode bookingMode,
        int durationMinutes,
        int bufferMinutes,
        int quantity
) {
}
