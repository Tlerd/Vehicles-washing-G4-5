package com.autowashpro.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Schema(description = "Owner-safe booking summary. Customer IDs, phone numbers, and proof data are omitted.")
public record BookingLookupResponse(
        String bookingRef,
        String status,
        Long branchId,
        String branchName,
        String branchAddress,
        LocalDate bookingDate,
        LocalTime bookingTime,
        LocalTime endTime,
        Integer durationMinutes,
        BigDecimal totalPrice,
        String licensePlate,
        String vehicleBrand,
        String vehicleSize,
        LocalDateTime createdAt) {
}
