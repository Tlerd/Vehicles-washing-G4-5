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
    interface LegacyAvailabilityProjection {
        Long getBookingId();
        String getStatus();
        LocalTime getBookingTime();
        LocalTime getEndTime();
        Integer getDurationMinutes();
        Boolean getLegacyFinancialSnapshot();
    }
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

    @Query("""
            SELECT b.bookingId AS bookingId,
                   b.status AS status,
                   b.bookingTime AS bookingTime,
                   b.endTime AS endTime,
                   b.durationMinutes AS durationMinutes,
                   b.legacyFinancialSnapshot AS legacyFinancialSnapshot
            FROM Booking b
            WHERE b.branch.branchId = :branchId
              AND b.bookingDate = :date
              AND b.legacyFinancialSnapshot = true
              AND b.status IN :statuses
            """)
    List<LegacyAvailabilityProjection> findLegacyAvailabilityCandidates(
            @Param("branchId") Long branchId,
            @Param("date") LocalDate date,
            @Param("statuses") List<String> statuses);
}
