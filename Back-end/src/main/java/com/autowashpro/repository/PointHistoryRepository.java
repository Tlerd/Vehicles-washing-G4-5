package com.autowashpro.repository;

import com.autowashpro.entity.PointHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface PointHistoryRepository extends JpaRepository<PointHistory, Long> {
    boolean existsByBookingBookingIdAndActivityType(Long bookingId, String activityType);
    List<PointHistory> findByCustomerCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<PointHistory> findByActivityTypeAndCreatedAtBefore(String activityType, LocalDateTime before);
}
