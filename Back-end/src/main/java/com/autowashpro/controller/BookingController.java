package com.autowashpro.controller;

import com.autowashpro.dto.request.BookingRequest;
import com.autowashpro.dto.response.AvailableSlotsResponse;
import com.autowashpro.dto.response.BookingResponse;
import com.autowashpro.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "API đặt lịch rửa xe")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "http://localhost:5173"
})
public class BookingController {

    private final BookingService bookingService;

    @Operation(summary = "Tạo lịch đặt rửa xe mới")
    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bookingService.createBooking(request));
    }

    @Operation(summary = "Lấy danh sách lịch đặt của một khách hàng")
    @GetMapping
    public ResponseEntity<List<BookingResponse>> getBookings(
            @RequestParam Long customerId
    ) {
        return ResponseEntity.ok(bookingService.getBookingsByCustomer(customerId));
    }

    @Operation(summary = "Tra cứu khung giờ còn trống của một chi nhánh theo ngày")
    @GetMapping("/available-slots")
    public ResponseEntity<AvailableSlotsResponse> getAvailableSlots(
            @RequestParam Long branchId,
            @RequestParam LocalDate date
    ) {
        return ResponseEntity.ok(bookingService.getAvailableSlots(branchId, date));
    }
}
