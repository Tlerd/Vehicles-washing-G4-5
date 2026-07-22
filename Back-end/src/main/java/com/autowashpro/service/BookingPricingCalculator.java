package com.autowashpro.service;

import com.autowashpro.domain.booking.BookingPriceSummary;
import com.autowashpro.domain.booking.BookingItemPolicy;
import com.autowashpro.domain.booking.PricedBookingLine;
import com.autowashpro.domain.booking.PricingUnit;
import com.autowashpro.domain.booking.TrustedBookingItem;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.exception.custom.BadRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Component
public class BookingPricingCalculator {

    private static final BigDecimal THOUSAND = new BigDecimal("1000");
    private static final BigDecimal FIFTY_THOUSAND = new BigDecimal("50000");
    private static final BigDecimal TWO_HUNDRED_THOUSAND = new BigDecimal("200000");
    private static final BigDecimal FIVE_HUNDRED_THOUSAND = new BigDecimal("500000");
    private static final BigDecimal TWO_MILLION = new BigDecimal("2000000");
    private static final BigDecimal MAX_DATABASE_MONEY = new BigDecimal("9999999999.99");

    public BookingPriceSummary calculate(
            List<TrustedBookingItem> items,
            VehicleSize vehicleSize,
            BigDecimal validatedVoucherDiscount,
            boolean guest,
            boolean depositWaived,
            boolean requiresFullPrepay
    ) {
        BookingItemPolicy.validateCanonicalItems(items);
        if (validatedVoucherDiscount == null || validatedVoucherDiscount.signum() < 0) {
            throw new BadRequestException("Voucher discount must not be negative.");
        }
        if (!isWholeVnd(validatedVoucherDiscount)) {
            throw new BadRequestException("Voucher discount must use whole VND.");
        }
        if (guest && validatedVoucherDiscount.signum() > 0) {
            throw new BadRequestException("Guests cannot use vouchers.");
        }

        List<PricedBookingLine> lines = new ArrayList<>(items.size());
        BigDecimal baseSubtotal = money(BigDecimal.ZERO);
        BigDecimal preVoucherTotal = money(BigDecimal.ZERO);

        for (TrustedBookingItem item : items) {
            validateItem(item);
            int units = BookingItemPolicy.billedUnits(item.pricingUnit(), item.quantity());
            BigDecimal multiplier = multiplier(item.sizeDependent(), vehicleSize);
            BigDecimal unitPrice = money(item.basePrice());
            BigDecimal baseLine = roundToThousand(item.basePrice().multiply(BigDecimal.valueOf(units)));
            BigDecimal lineTotal = roundToThousand(
                    item.basePrice().multiply(multiplier).multiply(BigDecimal.valueOf(units)));
            requireDatabaseMoney(baseLine);
            requireDatabaseMoney(lineTotal);
            baseSubtotal = baseSubtotal.add(baseLine);
            preVoucherTotal = preVoucherTotal.add(lineTotal);
            requireDatabaseMoney(baseSubtotal);
            requireDatabaseMoney(preVoucherTotal);
            lines.add(new PricedBookingLine(
                    item.serviceId(), item.quantity(), unitPrice, money(multiplier),
                    baseLine, lineTotal));
        }

        BigDecimal appliedDiscount = validatedVoucherDiscount.min(preVoucherTotal);
        BigDecimal total = preVoucherTotal.subtract(appliedDiscount);
        boolean effectiveDepositWaiver = !guest && depositWaived;
        BigDecimal deposit = requiresFullPrepay
                ? total
                : effectiveDepositWaiver ? BigDecimal.ZERO : depositFor(total);
        BigDecimal counterBalance = total.subtract(deposit);

        return new BookingPriceSummary(
                lines,
                money(baseSubtotal),
                money(preVoucherTotal.subtract(baseSubtotal)),
                money(appliedDiscount),
                money(total),
                money(deposit),
                money(counterBalance));
    }

    private void validateItem(TrustedBookingItem item) {
        if (item.basePrice() == null || item.basePrice().signum() <= 0
                || item.basePrice().compareTo(MAX_DATABASE_MONEY) > 0) {
            throw new BadRequestException("Service price is invalid.");
        }
        if (!isWholeVnd(item.basePrice())) {
            throw new BadRequestException("Service price must use whole VND.");
        }
        if (item.pricingUnit() == null) {
            throw new BadRequestException("Service pricing unit is invalid.");
        }
    }

    private BigDecimal multiplier(boolean sizeDependent, VehicleSize size) {
        if (!sizeDependent) {
            return BigDecimal.ONE;
        }
        if (size == null) {
            throw new BadRequestException("Vehicle size is required for the selected service.");
        }
        return switch (size) {
            case HATCHBACK -> new BigDecimal("0.90");
            case SEDAN -> new BigDecimal("1.00");
            case SUV -> new BigDecimal("1.20");
            case PICKUP -> new BigDecimal("1.40");
        };
    }

    private BigDecimal depositFor(BigDecimal total) {
        BigDecimal bracket;
        if (total.compareTo(FIVE_HUNDRED_THOUSAND) < 0) {
            bracket = FIFTY_THOUSAND;
        } else if (total.compareTo(TWO_MILLION) <= 0) {
            bracket = TWO_HUNDRED_THOUSAND;
        } else {
            bracket = FIVE_HUNDRED_THOUSAND;
        }
        return bracket.min(total);
    }

    private BigDecimal roundToThousand(BigDecimal amount) {
        return money(amount.divide(THOUSAND, 0, RoundingMode.HALF_UP).multiply(THOUSAND));
    }

    private BigDecimal money(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.UNNECESSARY);
    }

    private void requireDatabaseMoney(BigDecimal amount) {
        if (amount.signum() < 0 || amount.compareTo(MAX_DATABASE_MONEY) > 0) {
            throw new BadRequestException("Booking total exceeds the supported amount.");
        }
    }

    private boolean isWholeVnd(BigDecimal amount) {
        return amount.stripTrailingZeros().scale() <= 0;
    }
}
