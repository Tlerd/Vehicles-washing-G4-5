package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByBranchBranchIdAndBookingDateAndBookingTimeAndStatusNot(Long branchId, LocalDate date, LocalTime time, String status);
    List<Booking> findByCustomerCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Booking> findByBookingDateOrderByBookingTimeAsc(LocalDate date);
    List<Booking> findByBranchBranchIdAndBookingDateAndStatusNot(Long branchId, LocalDate date, String status);
    boolean existsByCustomerCustomerIdAndStatusIn(Long customerId, List<String> statuses);
    List<Booking> findByCustomerCustomerIdAndStatusAndBookingDateGreaterThanEqual(Long customerId, String status, LocalDate fromDate);
}
