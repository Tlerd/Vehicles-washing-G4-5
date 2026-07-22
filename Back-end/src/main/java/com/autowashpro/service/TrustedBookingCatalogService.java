package com.autowashpro.service;

import com.autowashpro.domain.booking.BayType;
import com.autowashpro.domain.booking.BookingMode;
import com.autowashpro.domain.booking.PricingUnit;
import com.autowashpro.domain.booking.TrustedBookingItem;
import com.autowashpro.domain.booking.TrustedBookingSelection;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class TrustedBookingCatalogService {

    private static final int MAX_ITEMS = 20;

    private final ServiceRepository services;

    public TrustedBookingCatalogService(ServiceRepository services) {
        this.services = services;
    }

    @Transactional(readOnly = true)
    public TrustedBookingSelection resolveByIds(List<Long> serviceIds, List<Integer> quantities) {
        validateIdentifiers(serviceIds);
        List<Integer> effectiveQuantities = quantitiesOrOnes(serviceIds.size(), quantities);
        List<com.autowashpro.entity.Service> loaded = services.findAllById(serviceIds);
        Map<Long, com.autowashpro.entity.Service> byId = new HashMap<>();
        for (com.autowashpro.entity.Service service : loaded) {
            byId.put(service.getServiceId(), service);
        }
        if (byId.size() != serviceIds.size()) {
            throw invalidCatalogSelection();
        }
        List<com.autowashpro.entity.Service> ordered = serviceIds.stream()
                .map(byId::get)
                .toList();
        return build(ordered, effectiveQuantities);
    }

    @Transactional(readOnly = true)
    public TrustedBookingSelection resolveByCodes(List<String> serviceCodes) {
        if (serviceCodes == null || serviceCodes.isEmpty() || serviceCodes.size() > MAX_ITEMS
                || serviceCodes.stream().anyMatch(
                code -> code == null || code.isBlank() || code.trim().length() > 30)) {
            throw invalidCatalogSelection();
        }
        List<String> normalized = serviceCodes.stream()
                .map(code -> code.trim().toLowerCase(Locale.ROOT))
                .toList();
        if (new HashSet<>(normalized).size() != normalized.size()) {
            throw invalidCatalogSelection();
        }
        List<com.autowashpro.entity.Service> loaded = services.findByServiceCodeIn(serviceCodes);
        Map<String, com.autowashpro.entity.Service> byCode = new HashMap<>();
        for (com.autowashpro.entity.Service service : loaded) {
            byCode.put(service.getServiceCode().toLowerCase(Locale.ROOT), service);
        }
        if (byCode.size() != normalized.size()) {
            throw invalidCatalogSelection();
        }
        return build(normalized.stream().map(byCode::get).toList(),
                java.util.Collections.nCopies(normalized.size(), 1));
    }

    private TrustedBookingSelection build(
            List<com.autowashpro.entity.Service> ordered, List<Integer> quantities) {
        List<TrustedBookingItem> items = new ArrayList<>(ordered.size());
        Set<BayType> requiredBayTypes = new HashSet<>();
        for (int index = 0; index < ordered.size(); index++) {
            com.autowashpro.entity.Service service = ordered.get(index);
            if (!"ACTIVE".equalsIgnoreCase(service.getStatus())
                    || !Boolean.TRUE.equals(service.getBookingConfigured())
                    || service.getBasePrice() == null
                    || service.getBasePrice().compareTo(BigDecimal.ZERO) < 0
                    || service.getDurationMinutes() == null
                    || service.getBufferMinutes() == null) {
                throw invalidCatalogSelection();
            }
            try {
                PricingUnit pricingUnit = PricingUnit.valueOf(
                        service.getPricingUnit().toUpperCase(Locale.ROOT));
                BookingMode bookingMode = BookingMode.valueOf(
                        service.getBookingMode().toUpperCase(Locale.ROOT));
                BayType bayType = BayType.valueOf(
                        service.getRequiredBayType().toUpperCase(Locale.ROOT));
                items.add(new TrustedBookingItem(
                        service.getServiceId(), service.getBasePrice(),
                        Boolean.TRUE.equals(service.getSizeDependent()), pricingUnit, bookingMode,
                        service.getDurationMinutes(), service.getBufferMinutes(), quantities.get(index)));
                requiredBayTypes.add(bayType);
            } catch (IllegalArgumentException | NullPointerException invalidConfiguration) {
                throw invalidCatalogSelection();
            }
        }
        return new TrustedBookingSelection(items, requiredBayTypes);
    }

    private void validateIdentifiers(List<Long> identifiers) {
        if (identifiers == null || identifiers.isEmpty() || identifiers.size() > MAX_ITEMS
                || identifiers.stream().anyMatch(id -> id == null || id <= 0)
                || new HashSet<>(identifiers).size() != identifiers.size()) {
            throw invalidCatalogSelection();
        }
    }

    private List<Integer> quantitiesOrOnes(int itemCount, List<Integer> quantities) {
        if (quantities == null || quantities.isEmpty()) {
            return java.util.Collections.nCopies(itemCount, 1);
        }
        if (quantities.size() != itemCount || quantities.stream().anyMatch(quantity -> quantity == null)) {
            throw invalidCatalogSelection();
        }
        return List.copyOf(quantities);
    }

    private BadRequestException invalidCatalogSelection() {
        return new BadRequestException("One or more services are invalid, inactive, or not configured for booking.");
    }
}
