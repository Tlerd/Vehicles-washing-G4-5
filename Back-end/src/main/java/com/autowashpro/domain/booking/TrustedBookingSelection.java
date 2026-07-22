package com.autowashpro.domain.booking;

import java.util.List;
import java.util.Set;

/** Catalog values loaded by the backend together with their bay requirements. */
public record TrustedBookingSelection(
        List<TrustedBookingItem> items,
        Set<BayType> requiredBayTypes
) {
    public TrustedBookingSelection {
        items = items == null ? List.of() : List.copyOf(items);
        requiredBayTypes = requiredBayTypes == null ? Set.of() : Set.copyOf(requiredBayTypes);
    }
}
