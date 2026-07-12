package com.autowashpro.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class BookingResponse {

    private Long bookingId;

    private String bookingRef;

    private Long customerId;

    private Long vehicleId;

    private Long branchId;

    private LocalDate bookingDate;

    private LocalTime bookingTime;

    private List<Long> serviceIds;

    private BigDecimal totalPrice;

    private String status;

    private Integer pointsEarned;

    private LocalDateTime createdAt;
}
