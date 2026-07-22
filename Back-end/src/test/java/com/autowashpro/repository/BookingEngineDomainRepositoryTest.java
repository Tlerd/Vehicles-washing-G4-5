package com.autowashpro.repository;

import com.autowashpro.entity.Service;
import com.autowashpro.entity.Tier;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class BookingEngineDomainRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private TierRepository tierRepository;

    @Test
    void configuredService_roundTripsTrustedBookingMetadata() {
        Service service = serviceRepository.findByServiceCodeIn(java.util.List.of("wc1"))
                .stream().findFirst().orElseThrow();

        assertThat(service.getBookingConfigured()).isTrue();
        assertThat(service.getBookingMode()).isEqualTo("SLOT");
        assertThat(service.getPricingUnit()).isEqualTo("PER_CAR");
        assertThat(service.getRequiredBayType()).isEqualTo("QUICK");
        assertThat(service.getBufferMinutes()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void tierPolicy_isLoadedFromDatabase() {
        Tier gold = tierRepository.findByTierCodeIgnoreCase("gold").orElseThrow();

        assertThat(gold.getTierRank()).isEqualTo(3);
        assertThat(gold.getBookingWindowDays()).isEqualTo(12);
        assertThat(gold.getDepositWaived()).isTrue();
        assertThat(gold.getPointsMultiplier()).isEqualByComparingTo("1.20");
    }

    @Test
    void configuredServices_matchApprovedCatalogSnapshots() {
        Map<String, CatalogSnapshot> expected = Map.of(
                "wc1", new CatalogSnapshot("180000", 20, true, "PER_CAR"),
                "wc2", new CatalogSnapshot("280000", 20, true, "PER_CAR"),
                "wc3", new CatalogSnapshot("640000", 40, true, "PER_CAR"),
                "wc4", new CatalogSnapshot("90000", 20, true, "PER_CAR"),
                "wc5", new CatalogSnapshot("50000", 20, true, "PER_CAR"),
                "ic1", new CatalogSnapshot("1400000", 120, true, "PER_CAR"),
                "ic2", new CatalogSnapshot("1900000", 180, true, "PER_CAR"),
                "ic3", new CatalogSnapshot("2300000", 180, true, "PER_CAR"),
                "ic4", new CatalogSnapshot("350000", 60, false, "PER_SEAT"),
                "ic5", new CatalogSnapshot("1200000", 90, false, "PER_CAR")
        );

        Map<String, Service> actual = serviceRepository.findByServiceCodeIn(expected.keySet().stream().toList())
                .stream().collect(java.util.stream.Collectors.toMap(Service::getServiceCode, service -> service));

        assertThat(actual).hasSize(expected.size());
        expected.forEach((code, snapshot) -> {
            Service service = actual.get(code);
            assertThat(service).as(code).isNotNull();
            assertThat(service.getBasePrice()).as(code + " price")
                    .isEqualByComparingTo(snapshot.price());
            assertThat(service.getDurationMinutes()).as(code + " duration")
                    .isEqualTo(snapshot.durationMinutes());
            assertThat(service.getSizeDependent()).as(code + " size-dependent")
                    .isEqualTo(snapshot.sizeDependent());
            assertThat(service.getPricingUnit()).as(code + " unit")
                    .isEqualTo(snapshot.pricingUnit());
        });
    }

    private record CatalogSnapshot(
            String price,
            int durationMinutes,
            boolean sizeDependent,
            String pricingUnit
    ) {
    }
}
