package com.autowashpro.dto.booking;

import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;

@Data @Builder
public class BookingResponse {
    private Long id;
    private String bookingRef;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long vehicleId;
    private String licensePlate;
    private String vehicleBrand;
    private String vehicleSize;
    private Long branchId;
    private List<Long> serviceIds;
    private List<String> serviceNames;
    private LocalDate bookingDate;
    private LocalTime bookingTime;
    private LocalTime endTime;
    private Integer durationMinutes;
    private BigDecimal totalPrice;
    private String status;
    private Integer pointsEarned;
    private Long appliedVoucherId;
    private LocalDateTime createdAt;
    private String vietQrUrl;
}
