package com.autowashpro.dto.booking;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class CreateBookingRequest {
    @NotNull private Long customerId;
    private Long vehicleId;
    private String licensePlate;
    private String brand;
    private String vehicleSize;
    @NotNull private Long branchId;
    @NotEmpty private List<String> serviceCodes;
    @NotNull @FutureOrPresent private LocalDate bookingDate;
    @NotNull private LocalTime bookingTime;
    private Long voucherId;
}
