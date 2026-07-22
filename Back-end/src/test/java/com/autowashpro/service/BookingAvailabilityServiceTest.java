package com.autowashpro.service;

import com.autowashpro.domain.booking.BayType;
import com.autowashpro.domain.booking.BookingDurationSummary;
import com.autowashpro.domain.booking.BookingMode;
import com.autowashpro.domain.booking.PricingUnit;
import com.autowashpro.domain.booking.TrustedBookingItem;
import com.autowashpro.domain.booking.TrustedBookingSelection;
import com.autowashpro.dto.booking.SlotAvailabilityResponse;
import com.autowashpro.dto.booking.SlotOptionResponse;
import com.autowashpro.dto.booking.AlternativeSlotResponse;
import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.SlotReservationRepository;
import com.autowashpro.repository.TierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingAvailabilityServiceTest {

    private static final Long BRANCH_ID = 41L;
    private static final LocalDate DATE = LocalDate.of(2026, 7, 23);
    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-07-21T01:00:00Z"), ZoneOffset.UTC);

    @Mock private BranchRepository branches;
    @Mock private BayRepository bays;
    @Mock private SlotReservationRepository reservations;
    @Mock private BookingRepository bookings;
    @Mock private TrustedBookingCatalogService catalog;
    @Mock private CustomerRepository customers;
    @Mock private TierRepository tiers;

    private BookingAvailabilityService availability;
    private Branch branch;

    @BeforeEach
    void setUp() {
        availability = new BookingAvailabilityService(
                branches, bays, reservations, bookings, catalog,
                new BookingDurationCalculator(), customers, tiers, CLOCK);
        branch = activeBranch();
        lenient().when(branches.findById(BRANCH_ID)).thenReturn(Optional.of(branch));
        lenient().when(bays.findActiveByBranchId(BRANCH_ID)).thenReturn(List.of(
                bay(1L, "Q1", "QUICK"), bay(2L, "Q2", "QUICK"),
                bay(3L, "D1", "DETAIL"), bay(4L, "U1", "UNIVERSAL")));
        lenient().when(reservations.findBlockingSlots(eq(BRANCH_ID), any(), any(), any()))
                .thenReturn(List.of());
        lenient().when(bookings.findLegacyAvailabilityCandidates(
                        eq(BRANCH_ID), any(LocalDate.class), anyList()))
                .thenReturn(List.of());
    }

    @Test
    void slotMode_returnsAllFortyFourQuarterHourCellsIncludingLateClosedCells() {
        SlotAvailabilityResponse result = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.QUICK, 35, 10), null, null);

        assertThat(result.slots()).hasSize(44);
        assertThat(result.slotMinutes()).isEqualTo(15);
        assertThat(result.requiredSlots()).isEqualTo(3);
        assertThat(result.reservedMinutes()).isEqualTo(45);
        assertThat(result.slots().get(0).startAt()).isEqualTo(Instant.parse("2026-07-23T00:00:00Z"));
        assertThat(result.slots().get(43).startAt()).isEqualTo(Instant.parse("2026-07-23T10:45:00Z"));
        assertThat(slotAt(result, "2026-07-23T10:15:00Z").available()).isTrue();
        assertThat(slotAt(result, "2026-07-23T10:30:00Z").reason())
                .isEqualTo("OUTSIDE_OPERATING_HOURS");
    }

    @Test
    void compatibleBayCount_drivesAvailableLimitedAndFullStates() {
        SlotAvailabilityResponse quick = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.QUICK, 5, 10), null, null);
        SlotAvailabilityResponse detail = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.DETAIL, 5, 10), null, null);
        SlotAvailabilityResponse universal = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.UNIVERSAL, 5, 10), null, null);

        assertThat(quick.slots().get(0).availableBayCount()).isEqualTo(3);
        assertThat(quick.slots().get(0).state()).isEqualTo("AVAILABLE");
        assertThat(detail.slots().get(0).availableBayCount()).isEqualTo(2);
        assertThat(universal.slots().get(0).availableBayCount()).isEqualTo(1);
        assertThat(universal.slots().get(0).state()).isEqualTo("LIMITED");
    }

    @Test
    void consecutiveCapacity_mustExistInOneCompatibleBay() {
        LocalDateTime ten = DATE.atTime(10, 0);
        when(reservations.findBlockingSlots(eq(BRANCH_ID), any(), any(), any())).thenReturn(List.of(
                blocking(1L, 101L, ten),
                blocking(2L, 102L, ten.plusMinutes(15)),
                blocking(4L, 103L, ten.plusMinutes(30))));

        SlotAvailabilityResponse result = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.QUICK, 35, 10), null, null);

        SlotOptionResponse tenOClock = slotAt(result, "2026-07-23T03:00:00Z");
        assertThat(tenOClock.available()).isFalse();
        assertThat(tenOClock.state()).isEqualTo("FULL");
        assertThat(tenOClock.availableBayCount()).isZero();
    }

    @Test
    void legacyActiveBooking_withoutCompleteReservationsBlocksBranchCapacity() {
        when(bookings.findLegacyAvailabilityCandidates(eq(BRANCH_ID), eq(DATE), anyList()))
                .thenReturn(List.of(legacyBooking(
                        500L, "CONFIRMED", LocalTime.of(10, 0), null, 45, true)));

        SlotAvailabilityResponse result = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.QUICK, 5, 10), null, null);

        assertThat(slotAt(result, "2026-07-23T03:15:00Z").state()).isEqualTo("FULL");
        assertThat(slotAt(result, "2026-07-23T03:45:00Z").available()).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"CHECKED_IN", "IN_PROGRESS", "AWAITING_CONFIRM"})
    void everyApprovedActiveLegacyStatus_blocksWithoutReservations(String status) {
        when(bookings.findLegacyAvailabilityCandidates(eq(BRANCH_ID), eq(DATE), anyList()))
                .thenReturn(List.of(legacyBooking(
                        501L, status, LocalTime.of(10, 0), null, 45, true)));

        SlotAvailabilityResponse result = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.QUICK, 5, 10), null, null);

        assertThat(slotAt(result, "2026-07-23T03:15:00Z").state()).isEqualTo("FULL");
    }

    @Test
    void completeContiguousReservationSet_removesLegacyBranchWideFallback() {
        LocalDateTime ten = DATE.atTime(10, 0);
        when(bookings.findLegacyAvailabilityCandidates(eq(BRANCH_ID), eq(DATE), anyList()))
                .thenReturn(List.of(legacyBooking(
                        502L, "CONFIRMED", LocalTime.of(10, 0), null, 45, true)));
        when(reservations.findBlockingSlots(eq(BRANCH_ID), any(), any(), any())).thenReturn(List.of(
                blocking(1L, 502L, ten),
                blocking(1L, 502L, ten.plusMinutes(15)),
                blocking(1L, 502L, ten.plusMinutes(30))));

        SlotAvailabilityResponse result = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.QUICK, 5, 10), null, null);

        assertThat(slotAt(result, "2026-07-23T03:00:00Z").available()).isTrue();
        assertThat(slotAt(result, "2026-07-23T03:00:00Z").availableBayCount()).isEqualTo(2);
    }

    @Test
    void minimumAdvanceAndBookingWindow_areEvaluatedInVietnamTime() {
        BookingAvailabilityService sameDayAvailability = new BookingAvailabilityService(
                branches, bays, reservations, bookings, catalog,
                new BookingDurationCalculator(), customers, tiers,
                Clock.fixed(Instant.parse("2026-07-22T01:00:00Z"), ZoneOffset.UTC));
        LocalDate sameDay = LocalDate.of(2026, 7, 22);
        when(bookings.findLegacyAvailabilityCandidates(eq(BRANCH_ID), eq(sameDay), anyList()))
                .thenReturn(List.of());

        SlotAvailabilityResponse sameDayResult = sameDayAvailability.availabilityForSelection(
                BRANCH_ID, sameDay, selection(BayType.QUICK, 5, 10), null, null);
        SlotAvailabilityResponse outsideWindow = sameDayAvailability.availabilityForSelection(
                BRANCH_ID, LocalDate.of(2026, 7, 30), selection(BayType.QUICK, 5, 10), null, null);

        assertThat(slotAt(sameDayResult, "2026-07-22T02:15:00Z").reason())
                .isEqualTo("MINIMUM_ADVANCE");
        assertThat(slotAt(sameDayResult, "2026-07-22T02:30:00Z").available()).isTrue();
        assertThat(outsideWindow.slots()).hasSize(44);
        assertThat(outsideWindow.slots()).allMatch(slot -> "OUTSIDE_BOOKING_WINDOW".equals(slot.reason()));
    }

    @Test
    void flexibleSelection_hasNoHardCapacityGrid() {
        SlotAvailabilityResponse result = availability.availabilityForSelection(
                BRANCH_ID, DATE, flexibleSelection(), null, null);

        assertThat(result.bookingMode()).isEqualTo("FLEXIBLE");
        assertThat(result.requiredSlots()).isZero();
        assertThat(result.slots()).isEmpty();
        assertThat(result.alternatives()).isEmpty();
        verify(bays, never()).findActiveByBranchId(any());
        verify(reservations, never()).findBlockingSlots(any(), any(), any(), any());
    }

    @Test
    void unavailableRequestedStart_returnsExactlyThreeLaterCapacityValidAlternatives() {
        LocalDateTime requested = DATE.atTime(13, 15);
        when(reservations.findBlockingSlots(eq(BRANCH_ID), any(), any(), any())).thenReturn(List.of(
                blocking(1L, 201L, requested),
                blocking(2L, 202L, requested),
                blocking(4L, 203L, requested)));

        SlotAvailabilityResponse result = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.QUICK, 5, 10),
                requested.toInstant(ZoneOffset.ofHours(7)), null);

        assertThat(result.alternatives()).hasSize(3);
        assertThat(result.alternatives()).extracting(alternative -> alternative.startAt())
                .containsExactly(
                        Instant.parse("2026-07-23T06:30:00Z"),
                        Instant.parse("2026-07-23T06:45:00Z"),
                        Instant.parse("2026-07-23T07:00:00Z"));
    }

    @Test
    void compatibilityDuration_isBoundedBeforeAnyCapacityQuery() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        availability.availabilityForCompatibilityDuration(
                                BRANCH_ID, DATE, 661, null, null))
                .isInstanceOf(com.autowashpro.exception.custom.BadRequestException.class);

        verify(branches, never()).findById(any());
        verify(reservations, never()).findBlockingSlots(any(), any(), any(), any());
    }

    @Test
    void authenticatedCustomerWindow_comesFromServerTierConfiguration() {
        com.autowashpro.entity.Customer customer = new com.autowashpro.entity.Customer();
        customer.setCustomerId(91L);
        customer.setTier("GOLD");
        com.autowashpro.entity.Tier tier = new com.autowashpro.entity.Tier();
        tier.setTierCode("GOLD");
        tier.setBookingWindowDays(12);
        when(customers.findById(91L)).thenReturn(Optional.of(customer));
        when(tiers.findByTierCodeIgnoreCase("GOLD")).thenReturn(Optional.of(tier));
        BookingAvailabilityService tierAvailability = new BookingAvailabilityService(
                branches, bays, reservations, bookings, catalog,
                new BookingDurationCalculator(), customers, tiers,
                Clock.fixed(Instant.parse("2026-07-22T01:00:00Z"), ZoneOffset.UTC));

        SlotAvailabilityResponse lastAllowed = tierAvailability.availabilityForSelection(
                BRANCH_ID, LocalDate.of(2026, 8, 3),
                selection(BayType.QUICK, 5, 10), null, 91L);
        SlotAvailabilityResponse firstDenied = tierAvailability.availabilityForSelection(
                BRANCH_ID, LocalDate.of(2026, 8, 4),
                selection(BayType.QUICK, 5, 10), null, 91L);

        assertThat(lastAllowed.bookingWindowDays()).isEqualTo(12);
        assertThat(lastAllowed.slots()).anyMatch(SlotOptionResponse::available);
        assertThat(firstDenied.slots()).allMatch(
                slot -> "OUTSIDE_BOOKING_WINDOW".equals(slot.reason()));
    }

    @Test
    void alternatives_continueOnFollowingBusinessDayNearClosing() {
        LocalDateTime requested = DATE.atTime(17, 45);
        when(reservations.findBlockingSlots(eq(BRANCH_ID), any(), any(), any())).thenReturn(List.of(
                blocking(1L, 301L, requested),
                blocking(2L, 302L, requested),
                blocking(4L, 303L, requested)));

        SlotAvailabilityResponse result = availability.availabilityForSelection(
                BRANCH_ID, DATE, selection(BayType.QUICK, 5, 10),
                requested.toInstant(ZoneOffset.ofHours(7)), null);

        assertThat(result.alternatives()).hasSize(3);
        assertThat(result.alternatives()).extracting(AlternativeSlotResponse::startAt)
                .containsExactly(
                        Instant.parse("2026-07-24T00:00:00Z"),
                        Instant.parse("2026-07-24T00:15:00Z"),
                        Instant.parse("2026-07-24T00:30:00Z"));
    }

    @Test
    void extremeTemporalInputs_areRejectedBeforeDatabaseCapacityQueries() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        availability.availabilityForSelection(
                                BRANCH_ID, LocalDate.MAX,
                                selection(BayType.QUICK, 5, 10), null, null))
                .isInstanceOf(com.autowashpro.exception.custom.BadRequestException.class);
        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                        availability.availabilityForSelection(
                                BRANCH_ID, DATE,
                                selection(BayType.QUICK, 5, 10), Instant.MAX, null))
                .isInstanceOf(com.autowashpro.exception.custom.BadRequestException.class);

        verify(reservations, never()).findBlockingSlots(any(), any(), any(), any());
    }

    @Test
    void maximumCompatibilityDuration_usesAllFortyFourSlots() {
        SlotAvailabilityResponse result = availability.availabilityForCompatibilityDuration(
                BRANCH_ID, DATE, 660, null, null);

        assertThat(result.requiredSlots()).isEqualTo(44);
        assertThat(result.slots()).hasSize(44);
        assertThat(result.slots().get(0).available()).isTrue();
        assertThat(result.slots().subList(1, 44)).allMatch(slot -> !slot.available());
    }

    private TrustedBookingSelection selection(BayType bayType, int duration, int buffer) {
        TrustedBookingItem item = new TrustedBookingItem(
                1L, new BigDecimal("100000"), true, PricingUnit.PER_CAR,
                BookingMode.SLOT, duration, buffer, 1);
        return new TrustedBookingSelection(List.of(item), Set.of(bayType));
    }

    private TrustedBookingSelection flexibleSelection() {
        TrustedBookingItem item = new TrustedBookingItem(
                2L, new BigDecimal("1400000"), true, PricingUnit.PER_CAR,
                BookingMode.FLEXIBLE, 120, 15, 1);
        return new TrustedBookingSelection(List.of(item), Set.of(BayType.DETAIL));
    }

    private Branch activeBranch() {
        Branch value = new Branch();
        value.setBranchId(BRANCH_ID);
        value.setBranchName("Availability Branch");
        value.setStatus("ACTIVE");
        value.setBookingEnabled(true);
        value.setSlotMinutes(15);
        value.setMinAdvanceSlotMinutes(90);
        value.setMinAdvanceFlexibleMinutes(60);
        value.setOpenTime(LocalTime.of(7, 0));
        value.setCloseTime(LocalTime.of(18, 0));
        return value;
    }

    private Bay bay(Long id, String code, String type) {
        Bay value = new Bay();
        value.setBayId(id);
        value.setBranch(branch);
        value.setBayCode(code);
        value.setBayType(type);
        value.setActive(true);
        return value;
    }

    private SlotReservationRepository.BlockingSlotProjection blocking(
            Long bayId, Long bookingId, LocalDateTime slotTime) {
        return new SlotReservationRepository.BlockingSlotProjection() {
            @Override public Long getBayId() { return bayId; }
            @Override public Long getBookingId() { return bookingId; }
            @Override public LocalDateTime getSlotTime() { return slotTime; }
        };
    }

    private BookingRepository.LegacyAvailabilityProjection legacyBooking(
            Long bookingId,
            String status,
            LocalTime bookingTime,
            LocalTime endTime,
            Integer durationMinutes,
            boolean legacy) {
        return new BookingRepository.LegacyAvailabilityProjection() {
            @Override public Long getBookingId() { return bookingId; }
            @Override public String getStatus() { return status; }
            @Override public LocalTime getBookingTime() { return bookingTime; }
            @Override public LocalTime getEndTime() { return endTime; }
            @Override public Integer getDurationMinutes() { return durationMinutes; }
            @Override public Boolean getLegacyFinancialSnapshot() { return legacy; }
        };
    }

    private SlotOptionResponse slotAt(SlotAvailabilityResponse response, String instant) {
        Instant expected = Instant.parse(instant);
        return response.slots().stream()
                .filter(slot -> slot.startAt().equals(expected))
                .findFirst()
                .orElseThrow();
    }
}
