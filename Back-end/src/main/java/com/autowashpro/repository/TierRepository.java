package com.autowashpro.repository;

import com.autowashpro.entity.Tier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface TierRepository extends JpaRepository<Tier, Long> {

    Optional<Tier> findByTierCodeIgnoreCase(String tierCode);

    List<Tier> findAllByOrderByTierRankAsc();
}
