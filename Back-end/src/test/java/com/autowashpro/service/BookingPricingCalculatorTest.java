package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingMode;
import com.autowashpro.domain.booking.BookingPriceSummary;
import com.autowashpro.domain.booking.PricingUnit;
import com.autowashpro.domain.booking.TrustedBookingItem;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.exception.custom.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingPricingCalculatorTest {

    private final BookingPricingCalculator calculator = new BookingPricingCalculator();

    @ParameterizedTest
    @CsvSource({
            "HATCHBACK, 90000, 0.90",
            "SEDAN, 100000, 1.00",
            "SUV, 120000, 1.20",
            "PICKUP, 140000, 1.40"
    })
    void sizeMultiplier_isAppliedOnlyToDependentItems(
            VehicleSize size, String expected, String multiplier) {
        BookingPriceSummary result = calculate(
                List.of(item("100000", true, PricingUnit.PER_CAR, 1)),
                size, "0", false, false, false);

        assertThat(result.total()).isEqualByComparingTo(expected);
        assertThat(result.lines().get(0).sizeMultiplier()).isEqualByComparingTo(multiplier);
    }

    @Test
    void sizeIndependentItem_ignoresPickupMultiplier() {
        BookingPriceSummary result = calculate(
                List.of(item("100000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.PICKUP, "0", false, false, false);

        assertThat(result.total()).isEqualByComparingTo("100000");
        assertThat(result.lines().get(0).sizeMultiplier()).isEqualByComparingTo("1.00");
    }

    @Test
    void roundsEachLineBeforeAggregation() {
        BookingPriceSummary result = calculate(List.of(
                        item("100500", false, PricingUnit.PER_CAR, 1),
                        item(2L, "100500", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "0", false, false, false);

        assertThat(result.lines()).extracting(line -> line.lineTotal().toPlainString())
                .containsExactly("101000.00", "101000.00");
        assertThat(result.total()).isEqualByComparingTo("202000");
    }

    @Test
    void pricingUnit_controlsQuantity() {
        BookingPriceSummary result = calculate(List.of(
                        item("350000", false, PricingUnit.PER_SEAT, 2),
                        item(2L, "1400000", false, PricingUnit.PER_TIRE, 4)),
                VehicleSize.SUV, "0", false, false, false);

        assertThat(result.lines()).extracting(line -> line.lineTotal().toPlainString())
                .containsExactly("700000.00", "5600000.00");
        assertThat(result.total()).isEqualByComparingTo("6300000");
    }

    @Test
    void rejectsInvalidUnitQuantity() {
        assertThatThrownBy(() -> calculate(List.of(
                        item("100000", true, PricingUnit.PER_CAR, 2)),
                VehicleSize.SEDAN, "0", false, false, false))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> calculate(List.of(
                        item("100000", false, PricingUnit.PER_TIRE, 5)),
                VehicleSize.SEDAN, "0", false, false, false))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> calculate(List.of(
                        item("100000", false, PricingUnit.PER_SEAT, 0)),
                VehicleSize.SEDAN, "0", false, false, false))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void calculatesMixedItemSummaryAndVoucher() {
        BookingPriceSummary result = calculate(List.of(
                        item("100000", true, PricingUnit.PER_CAR, 1),
                        item(2L, "300000", false, PricingUnit.PER_SEAT, 2)),
                VehicleSize.SUV, "50000", false, false, false);

        assertThat(result.baseSubtotal()).isEqualByComparingTo("700000");
        assertThat(result.sizeAdjustment()).isEqualByComparingTo("20000");
        assertThat(result.voucherDiscount()).isEqualByComparingTo("50000");
        assertThat(result.total()).isEqualByComparingTo("670000");
        assertThat(result.depositRequired()).isEqualByComparingTo("200000");
        assertThat(result.counterBalance()).isEqualByComparingTo("470000");
    }

    @Test
    void capsDiscountAtOrderValue() {
        BookingPriceSummary result = calculate(
                List.of(item("40000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "50000", false, false, false);

        assertThat(result.voucherDiscount()).isEqualByComparingTo("40000");
        assertThat(result.total()).isZero();
        assertThat(result.depositRequired()).isZero();
        assertThat(result.counterBalance()).isZero();
    }

    @ParameterizedTest
    @CsvSource({
            "40000,40000",
            "499000,50000",
            "500000,200000",
            "2000000,200000",
            "2001000,500000"
    })
    void depositBracket_boundariesAndCapAreExact(String total, String expectedDeposit) {
        BookingPriceSummary result = calculate(
                List.of(item(total, false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "0", false, false, false);

        assertThat(result.depositRequired()).isEqualByComparingTo(expectedDeposit);
        assertThat(result.counterBalance()).isEqualByComparingTo(
                new BigDecimal(total).subtract(new BigDecimal(expectedDeposit)));
    }

    @Test
    void fullPrepayOverridesTierWaiver() {
        BookingPriceSummary waived = calculate(
                List.of(item("670000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "0", false, true, false);
        BookingPriceSummary forced = calculate(
                List.of(item("670000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "0", false, true, true);

        assertThat(waived.depositRequired()).isZero();
        assertThat(forced.depositRequired()).isEqualByComparingTo("670000");
    }

    @Test
    void guestNeverReceivesMemberTierDepositWaiver() {
        BookingPriceSummary result = calculate(
                List.of(item("670000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "0", true, true, false);

        assertThat(result.depositRequired()).isEqualByComparingTo("200000");
    }

    @Test
    void depositUsesPostVoucherBoundary() {
        BookingPriceSummary belowFiveHundredThousand = calculate(
                List.of(item("500000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "1", false, false, false);
        BookingPriceSummary aboveTwoMillion = calculate(
                List.of(item("2002000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "1999", false, false, false);

        assertThat(belowFiveHundredThousand.total()).isEqualByComparingTo("499999");
        assertThat(belowFiveHundredThousand.depositRequired()).isEqualByComparingTo("50000");
        assertThat(aboveTwoMillion.total()).isEqualByComparingTo("2000001");
        assertThat(aboveTwoMillion.depositRequired()).isEqualByComparingTo("500000");
    }

    @Test
    void guestCannotReceiveVoucherDiscount() {
        assertThatThrownBy(() -> calculate(
                List.of(item("100000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "50000", true, false, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Guests cannot use vouchers");
    }

    @Test
    void rejectsEmptyOrInvalidTrustedCatalogInputs() {
        assertThatThrownBy(() -> calculate(List.of(), VehicleSize.SEDAN,
                "0", false, false, false)).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> calculate(List.of(item("-1", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "0", false, false, false))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> calculate(List.of(item("100000", true, PricingUnit.PER_CAR, 1)),
                null, "0", false, false, false))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> calculate(List.of(item("100000", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "-1", false, false, false))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsDuplicateOrOversizedItemSets() {
        TrustedBookingItem item = item("100000", false, PricingUnit.PER_CAR, 1);
        assertThatThrownBy(() -> calculate(List.of(item, item), VehicleSize.SEDAN,
                "0", false, false, false))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Duplicate");

        List<TrustedBookingItem> tooMany = java.util.stream.LongStream.rangeClosed(1, 21)
                .mapToObj(id -> item(id, "1000", false, PricingUnit.PER_CAR, 1))
                .toList();
        assertThatThrownBy(() -> calculate(tooMany, VehicleSize.SEDAN,
                "0", false, false, false))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void roundsAfterMultiplicationAtExactHalfThousandBoundary() {
        BookingPriceSummary sedan = calculate(
                List.of(item("100500", true, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "0", false, false, false);
        BookingPriceSummary suv = calculate(
                List.of(item("100500", true, PricingUnit.PER_CAR, 1)),
                VehicleSize.SUV, "0", false, false, false);

        assertThat(sedan.total()).isEqualByComparingTo("101000");
        assertThat(suv.total()).isEqualByComparingTo("121000");
    }

    @Test
    void rejectsFractionalVndAndPersistenceOverflow() {
        assertThatThrownBy(() -> calculate(
                List.of(item("100000.50", false, PricingUnit.PER_CAR, 1)),
                VehicleSize.SEDAN, "0", false, false, false))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> calculate(
                List.of(item("9999999999", false, PricingUnit.PER_SEAT, 2)),
                VehicleSize.SEDAN, "0", false, false, false))
                .isInstanceOf(BadRequestException.class);
    }

    private BookingPriceSummary calculate(
            List<TrustedBookingItem> items,
            VehicleSize size,
            String discount,
            boolean guest,
            boolean waived,
            boolean fullPrepay
    ) {
        return calculator.calculate(items, size, new BigDecimal(discount), guest, waived, fullPrepay);
    }

    private TrustedBookingItem item(
            String basePrice, boolean sizeDependent, PricingUnit unit, int quantity) {
        return item(1L, basePrice, sizeDependent, unit, quantity);
    }

    private TrustedBookingItem item(
            long serviceId, String basePrice, boolean sizeDependent, PricingUnit unit, int quantity) {
        return new TrustedBookingItem(
                serviceId, new BigDecimal(basePrice), sizeDependent, unit,
                BookingMode.SLOT, 20, 10, quantity);
    }
}
