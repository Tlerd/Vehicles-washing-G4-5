package com.autowashpro.repository;

import com.autowashpro.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepository extends JpaRepository<Service, Long> {

}