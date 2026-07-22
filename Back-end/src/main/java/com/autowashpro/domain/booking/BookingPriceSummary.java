package com.autowashpro.domain.booking;

import java.math.BigDecimal;
import java.util.List;

public record BookingPriceSummary(
        List<PricedBookingLine> lines,
        BigDecimal baseSubtotal,
        BigDecimal sizeAdjustment,
        BigDecimal voucherDiscount,
        BigDecimal total,
        BigDecimal depositRequired,
        BigDecimal counterBalance
) {

    public BookingPriceSummary {
        lines = List.copyOf(lines);
    }
}
