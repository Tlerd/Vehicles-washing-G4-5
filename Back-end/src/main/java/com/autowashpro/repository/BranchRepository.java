package com.autowashpro.repository;

import com.autowashpro.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BranchRepository extends JpaRepository<Branch, Long> {

}