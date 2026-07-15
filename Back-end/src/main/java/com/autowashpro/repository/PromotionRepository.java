package com.autowashpro.repository;

import com.autowashpro.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByStatusIgnoreCaseOrderByStartDateDesc(String status);
    List<Promotion> findByStatusIgnoreCaseAndStartDateLessThanEqualAndEndDateGreaterThanEqual(String status, LocalDate start, LocalDate end);
}
