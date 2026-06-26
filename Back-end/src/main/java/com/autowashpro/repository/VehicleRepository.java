package com.autowashpro.repository;

import com.autowashpro.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

}