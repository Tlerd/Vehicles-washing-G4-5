package com.autowashpro.service;

import com.autowashpro.domain.booking.BayType;
import com.autowashpro.domain.booking.BookingMode;
import com.autowashpro.domain.booking.PricingUnit;
import com.autowashpro.domain.booking.TrustedBookingSelection;
import com.autowashpro.entity.Service;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.repository.ServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrustedBookingCatalogServiceTest {

    @Mock
    private ServiceRepository services;

    private TrustedBookingCatalogService catalog;

    @BeforeEach
    void setUp() {
        catalog = new TrustedBookingCatalogService(services);
    }

    @Test
    void resolveByIds_buildsTrustedItemsInRequestOrderAndUsesRequestedQuantityOnly() {
        Service tires = configuredService(7L, "tires", "PER_TIRE", "SLOT", "QUICK", 20, 5);
        Service wash = configuredService(3L, "wash", "PER_CAR", "SLOT", "QUICK", 40, 5);
        when(services.findAllById(List.of(7L, 3L))).thenReturn(List.of(wash, tires));

        TrustedBookingSelection result = catalog.resolveByIds(List.of(7L, 3L), List.of(4, 1));

        assertThat(result.items()).extracting(item -> item.serviceId()).containsExactly(7L, 3L);
        assertThat(result.items()).extracting(item -> item.quantity()).containsExactly(4, 1);
        assertThat(result.items().get(0).pricingUnit()).isEqualTo(PricingUnit.PER_TIRE);
        assertThat(result.items().get(0).bookingMode()).isEqualTo(BookingMode.SLOT);
        assertThat(result.requiredBayTypes()).containsExactly(BayType.QUICK);
    }

    @Test
    void resolveByCodes_defaultsQuantitiesToOneAndPreservesCodeOrder() {
        Service detail = configuredService(8L, "ic1", "PER_CAR", "FLEXIBLE", "DETAIL", 120, 15);
        Service coating = configuredService(9L, "ic2", "PER_CAR", "FLEXIBLE", "DETAIL", 180, 15);
        when(services.findByServiceCodeIn(List.of("ic2", "ic1"))).thenReturn(List.of(detail, coating));

        TrustedBookingSelection result = catalog.resolveByCodes(List.of("ic2", "ic1"));

        assertThat(result.items()).extracting(item -> item.serviceId()).containsExactly(9L, 8L);
        assertThat(result.items()).extracting(item -> item.quantity()).containsExactly(1, 1);
        assertThat(result.requiredBayTypes()).containsExactly(BayType.DETAIL);
    }

    @Test
    void resolve_rejectsDuplicateMissingInactiveOrUnconfiguredServices() {
        assertThatThrownBy(() -> catalog.resolveByIds(List.of(1L, 1L), List.of(1, 1)))
                .isInstanceOf(BadRequestException.class);

        when(services.findAllById(List.of(1L, 2L)))
                .thenReturn(List.of(configuredService(1L, "one", "PER_CAR", "SLOT", "QUICK", 20, 10)));
        assertThatThrownBy(() -> catalog.resolveByIds(List.of(1L, 2L), List.of(1, 1)))
                .isInstanceOf(BadRequestException.class);

        Service inactive = configuredService(4L, "inactive", "PER_CAR", "SLOT", "QUICK", 20, 10);
        inactive.setStatus("INACTIVE");
        when(services.findAllById(List.of(4L))).thenReturn(List.of(inactive));
        assertThatThrownBy(() -> catalog.resolveByIds(List.of(4L), List.of(1)))
                .isInstanceOf(BadRequestException.class);

        Service unconfigured = configuredService(5L, "old", "PER_CAR", "SLOT", "QUICK", 20, 10);
        unconfigured.setBookingConfigured(false);
        when(services.findAllById(List.of(5L))).thenReturn(List.of(unconfigured));
        assertThatThrownBy(() -> catalog.resolveByIds(List.of(5L), List.of(1)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void resolve_rejectsMismatchedQuantitiesAndInvalidServerConfiguration() {
        assertThatThrownBy(() -> catalog.resolveByIds(List.of(1L, 2L), List.of(1)))
                .isInstanceOf(BadRequestException.class);

        Service invalid = configuredService(6L, "broken", "PER_CAR", "SLOT", "QUICK", 20, 10);
        invalid.setPricingUnit("CLIENT_DEFINED");
        when(services.findAllById(List.of(6L))).thenReturn(List.of(invalid));

        assertThatThrownBy(() -> catalog.resolveByIds(List.of(6L), List.of(1)))
                .isInstanceOf(BadRequestException.class);

        assertThatThrownBy(() -> catalog.resolveByCodes(List.of("x".repeat(31))))
                .isInstanceOf(BadRequestException.class);
    }

    private Service configuredService(
            Long id, String code, String pricingUnit, String bookingMode,
            String bayType, int duration, int buffer) {
        Service service = new Service();
        service.setServiceId(id);
        service.setServiceCode(code);
        service.setServiceName(code);
        service.setBasePrice(new BigDecimal("100000"));
        service.setDurationMinutes(duration);
        service.setStatus("ACTIVE");
        service.setSizeDependent(true);
        service.setPricingUnit(pricingUnit);
        service.setBookingMode(bookingMode);
        service.setBufferMinutes(buffer);
        service.setRequiredBayType(bayType);
        service.setBookingConfigured(true);
        return service;
    }
}
