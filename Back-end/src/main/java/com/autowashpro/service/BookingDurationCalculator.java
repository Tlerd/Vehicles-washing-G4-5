package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingDurationSummary;
import com.autowashpro.domain.booking.BookingItemPolicy;
import com.autowashpro.domain.booking.BookingMode;
import com.autowashpro.domain.booking.TrustedBookingItem;
import com.autowashpro.exception.custom.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BookingDurationCalculator {

    private static final int SLOT_MINUTES = 15;
    private static final int MAX_DAILY_SLOTS = 44;
    private static final int MAX_FLEXIBLE_MINUTES = 3 * 24 * 60;

    public BookingDurationSummary calculate(List<TrustedBookingItem> items) {
        BookingItemPolicy.validateCanonicalItems(items);
        BookingMode bookingMode = null;
        long workMinutes = 0;
        long bufferMinutes = 0;
        try {
            for (TrustedBookingItem item : items) {
                validateItem(item);
                if (bookingMode == null) {
                    bookingMode = item.bookingMode();
                } else if (bookingMode != item.bookingMode()) {
                    throw new BadRequestException("Services with different booking modes cannot be combined.");
                }
                int units = BookingItemPolicy.billedUnits(
                        item.pricingUnit(), item.quantity());
                workMinutes = Math.addExact(
                        workMinutes, Math.multiplyExact((long) item.durationMinutes(), units));
                bufferMinutes = Math.addExact(bufferMinutes, item.bufferMinutes());
            }
            long occupiedMinutes = Math.addExact(workMinutes, bufferMinutes);
            if (workMinutes > Integer.MAX_VALUE || bufferMinutes > Integer.MAX_VALUE
                    || occupiedMinutes > Integer.MAX_VALUE) {
                throw new BadRequestException("Service duration exceeds the supported range.");
            }
            if (bookingMode == BookingMode.FLEXIBLE) {
                if (occupiedMinutes > MAX_FLEXIBLE_MINUTES) {
                    throw new BadRequestException(
                            "Flexible service duration cannot exceed three days.");
                }
                return new BookingDurationSummary(
                        bookingMode, (int) workMinutes, (int) bufferMinutes,
                        (int) occupiedMinutes, 0, 0);
            }
            long requiredSlotsLong = Math.addExact(occupiedMinutes, SLOT_MINUTES - 1) / SLOT_MINUTES;
            if (requiredSlotsLong > MAX_DAILY_SLOTS) {
                throw new BadRequestException("Selected services do not fit within one operating day.");
            }
            int requiredSlots = (int) requiredSlotsLong;
            int reservedMinutes = Math.multiplyExact(requiredSlots, SLOT_MINUTES);
            return new BookingDurationSummary(
                    bookingMode, (int) workMinutes, (int) bufferMinutes, (int) occupiedMinutes,
                    requiredSlots, reservedMinutes);
        } catch (ArithmeticException overflow) {
            throw new BadRequestException("Service duration exceeds the supported range.");
        }
    }

    private void validateItem(TrustedBookingItem item) {
        if (item.bookingMode() == null) {
            throw new BadRequestException("Service booking mode is invalid.");
        }
        if (item.durationMinutes() <= 0 || item.bufferMinutes() < 0) {
            throw new BadRequestException("Service duration configuration is invalid.");
        }
    }
}
