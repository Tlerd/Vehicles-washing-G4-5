package com.autowashpro.domain.booking;

import com.autowashpro.exception.custom.BadRequestException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Shared canonical item and quantity invariants for pricing and occupancy. */
public final class BookingItemPolicy {

    public static final int MAX_ITEMS = 20;
    public static final int MAX_UNIT_QUANTITY = 20;

    private BookingItemPolicy() {
    }

    public static void validateCanonicalItems(List<TrustedBookingItem> items) {
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("At least one service is required.");
        }
        if (items.size() > MAX_ITEMS) {
            throw new BadRequestException("At most 20 services are allowed per booking.");
        }
        Set<Long> serviceIds = new HashSet<>();
        for (TrustedBookingItem item : items) {
            if (item == null || item.serviceId() == null || item.serviceId() <= 0) {
                throw new BadRequestException("A configured service is required.");
            }
            if (!serviceIds.add(item.serviceId())) {
                throw new BadRequestException("Duplicate service IDs are not allowed.");
            }
        }
    }

    public static int billedUnits(PricingUnit pricingUnit, int quantity) {
        if (pricingUnit == null) {
            throw new BadRequestException("Service pricing unit is invalid.");
        }
        if (pricingUnit == PricingUnit.PER_CAR) {
            if (quantity != 1) {
                throw new BadRequestException("Per-car services require quantity 1.");
            }
            return 1;
        }
        int maximum = pricingUnit == PricingUnit.PER_TIRE ? 4 : MAX_UNIT_QUANTITY;
        if (quantity < 1 || quantity > maximum) {
            throw new BadRequestException("Service quantity is outside the allowed range.");
        }
        return quantity;
    }
}
