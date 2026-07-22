package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByBranchBranchIdAndBookingDateAndBookingTimeAndStatusNot(Long branchId, LocalDate date, LocalTime time, String status);
    List<Booking> findByCustomerCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Booking> findByBookingDateOrderByBookingTimeAsc(LocalDate date);
    List<Booking> findByBranchBranchIdAndBookingDateAndStatusNot(Long branchId, LocalDate date, String status);
    boolean existsByCustomerCustomerIdAndStatusIn(Long customerId, List<String> statuses);
    List<Booking> findByCustomerCustomerIdAndStatusAndBookingDateGreaterThanEqual(Long customerId, String status, LocalDate fromDate);
    Optional<Booking> findByBookingRef(String bookingRef);

    @Query("SELECT b FROM Booking b " +
            "LEFT JOIN FETCH b.customer " +
            "LEFT JOIN FETCH b.guest " +
            "LEFT JOIN FETCH b.vehicle " +
            "JOIN FETCH b.branch " +
            "WHERE b.bookingRef = :bookingRef")
    Optional<Booking> findForLookupByBookingRef(@Param("bookingRef") String bookingRef);
}
