package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    boolean existsByCustomerCustomerIdAndStatusIn(
            Long customerId,
            List<String> statuses
    );

    List<Booking> findByCustomerCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Booking> findByBranchBranchIdAndBookingDateAndStatusIn(
            Long branchId,
            LocalDate bookingDate,
            List<String> statuses
    );

    boolean existsByBookingRef(String bookingRef);
}