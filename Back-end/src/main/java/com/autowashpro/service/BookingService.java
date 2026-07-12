package com.autowashpro.service;

import com.autowashpro.dto.request.BookingRequest;
import com.autowashpro.dto.response.AvailableSlotsResponse;
import com.autowashpro.dto.response.BookingResponse;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request);

    List<BookingResponse> getBookingsByCustomer(Long customerId);

    AvailableSlotsResponse getAvailableSlots(Long branchId, LocalDate date);
}
