package com.autowashpro.repository;

import com.autowashpro.entity.BookingService;
import com.autowashpro.entity.BookingServiceId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingServiceRepository extends JpaRepository<BookingService, BookingServiceId> {
    List<BookingService> findByBookingBookingId(Long bookingId);
}
