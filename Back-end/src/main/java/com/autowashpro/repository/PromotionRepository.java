package com.autowashpro.repository;

import com.autowashpro.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

}