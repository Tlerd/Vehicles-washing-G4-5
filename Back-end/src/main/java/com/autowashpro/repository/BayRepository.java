package com.autowashpro.repository;

import com.autowashpro.entity.Bay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BayRepository extends JpaRepository<Bay, Long> {

    List<Bay> findByBranchBranchId(Long branchId);

    List<Bay> findByBranchBranchIdAndBayType(Long branchId, String bayType);
}
