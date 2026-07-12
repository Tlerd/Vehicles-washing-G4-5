package com.autowashpro.repository;

import com.autowashpro.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByCustomerCustomerId(Long customerId);

    Optional<Vehicle> findByVehicleIdAndCustomerCustomerId(
            Long vehicleId,
            Long customerId
    );

    boolean existsByCustomerCustomerIdAndLicensePlateIgnoreCase(
            Long customerId,
            String licensePlate
    );

    long countByCustomerCustomerId(Long customerId);
}