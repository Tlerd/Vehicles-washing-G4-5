package com.autowashpro.domain.booking;

import java.math.BigDecimal;

public record PricedBookingLine(
        Long serviceId,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal sizeMultiplier,
        BigDecimal baseLineSubtotal,
        BigDecimal lineTotal
) {
}
