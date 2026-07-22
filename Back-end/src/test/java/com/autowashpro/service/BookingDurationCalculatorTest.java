package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingDurationSummary;
import com.autowashpro.domain.booking.BookingMode;
import com.autowashpro.domain.booking.PricingUnit;
import com.autowashpro.domain.booking.TrustedBookingItem;
import com.autowashpro.exception.custom.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingDurationCalculatorTest {

    private final BookingDurationCalculator calculator = new BookingDurationCalculator();

    @ParameterizedTest
    @CsvSource({
            "20,10,30,2,30",
            "40,5,45,3,45",
            "65,10,75,5,75",
            "45,10,55,4,60"
    })
    void approvedCatalogExamples_haveExpectedSlots(
            int duration, int buffer, int occupied, int slots, int reserved) {
        BookingDurationSummary result = calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.SLOT, duration, buffer, 1)));

        assertThat(result.occupiedMinutes()).isEqualTo(occupied);
        assertThat(result.requiredSlots()).isEqualTo(slots);
        assertThat(result.reservedMinutes()).isEqualTo(reserved);
    }

    @Test
    void ceilIsAppliedAfterSummingAllLines() {
        BookingDurationSummary result = calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.SLOT, 20, 0, 1),
                item(2L, PricingUnit.PER_CAR, BookingMode.SLOT, 20, 0, 1)));

        assertThat(result.occupiedMinutes()).isEqualTo(40);
        assertThat(result.requiredSlots()).isEqualTo(3);
        assertThat(result.reservedMinutes()).isEqualTo(45);
    }

    @Test
    void perUnitDurationScalesWorkButNotTurnoverBuffer() {
        BookingDurationSummary result = calculator.calculate(List.of(
                item(PricingUnit.PER_TIRE, BookingMode.SLOT, 20, 5, 4)));

        assertThat(result.workMinutes()).isEqualTo(80);
        assertThat(result.bufferMinutes()).isEqualTo(5);
        assertThat(result.occupiedMinutes()).isEqualTo(85);
        assertThat(result.requiredSlots()).isEqualTo(6);
        assertThat(result.reservedMinutes()).isEqualTo(90);
    }

    @Test
    void flexibleServicesDoNotReserveHardSlots() {
        BookingDurationSummary result = calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.FLEXIBLE, 120, 15, 1)));

        assertThat(result.bookingMode()).isEqualTo(BookingMode.FLEXIBLE);
        assertThat(result.occupiedMinutes()).isEqualTo(135);
        assertThat(result.requiredSlots()).isZero();
        assertThat(result.reservedMinutes()).isZero();
    }

    @Test
    void mixedSlotAndFlexibleModes_areRejected() {
        assertThatThrownBy(() -> calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.SLOT, 20, 10, 1),
                item(2L, PricingUnit.PER_CAR, BookingMode.FLEXIBLE, 60, 15, 1))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("booking modes");
        assertThatThrownBy(() -> calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.FLEXIBLE, 60, 15, 1),
                item(2L, PricingUnit.PER_CAR, BookingMode.SLOT, 20, 10, 1))))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void configuredServiceRequiresValidDurationData() {
        assertThatThrownBy(() -> calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.SLOT, 0, 10, 1))))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.SLOT, 20, -1, 1))))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> calculator.calculate(List.of()))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsDuplicateServicesThatCouldManipulateBuffers() {
        TrustedBookingItem item = item(PricingUnit.PER_CAR, BookingMode.SLOT, 20, 10, 1);

        assertThatThrownBy(() -> calculator.calculate(List.of(item, item)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Duplicate");
    }

    @Test
    void slotDuration_isBoundedToTheFortyFourSlotOperatingDay() {
        BookingDurationSummary maximum = calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.SLOT, 650, 10, 1)));

        assertThat(maximum.requiredSlots()).isEqualTo(44);
        assertThat(maximum.reservedMinutes()).isEqualTo(660);
        assertThatThrownBy(() -> calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.SLOT, 651, 10, 1))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("operating day");
    }

    @Test
    void flexibleDuration_isBoundedToApprovedThreeDayMaximum() {
        BookingDurationSummary maximum = calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.FLEXIBLE, 4310, 10, 1)));

        assertThat(maximum.occupiedMinutes()).isEqualTo(4320);
        assertThatThrownBy(() -> calculator.calculate(List.of(
                item(PricingUnit.PER_CAR, BookingMode.FLEXIBLE, 4311, 10, 1))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("three days");
    }

    @Test
    void checkedDurationArithmetic_rejectsOverflow() {
        assertThatThrownBy(() -> calculator.calculate(List.of(
                item(PricingUnit.PER_SEAT, BookingMode.FLEXIBLE,
                        Integer.MAX_VALUE, 0, 20))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("duration");
    }

    private TrustedBookingItem item(
            PricingUnit unit, BookingMode mode, int duration, int buffer, int quantity) {
        return item(1L, unit, mode, duration, buffer, quantity);
    }

    private TrustedBookingItem item(
            long serviceId, PricingUnit unit, BookingMode mode,
            int duration, int buffer, int quantity) {
        return new TrustedBookingItem(
                serviceId, new BigDecimal("100000"), true, unit,
                mode, duration, buffer, quantity);
    }
}
