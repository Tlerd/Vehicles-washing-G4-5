package com.autowashpro.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class BookingRequest {

    @NotNull(message = "Khách hàng không được để trống")
    private Long customerId;

    @NotNull(message = "Phương tiện không được để trống")
    private Long vehicleId;

    @NotNull(message = "Chi nhánh không được để trống")
    private Long branchId;

    @NotNull(message = "Ngày đặt lịch không được để trống")
    @FutureOrPresent(message = "Ngày đặt lịch không được ở quá khứ")
    private LocalDate bookingDate;

    @NotNull(message = "Giờ đặt lịch không được để trống")
    private LocalTime bookingTime;

    @NotEmpty(message = "Phải chọn ít nhất một dịch vụ")
    private List<Long> serviceIds;
}
