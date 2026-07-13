package com.autowashpro.service;

import com.autowashpro.dto.vehicle.VehicleRequest;
import com.autowashpro.dto.vehicle.VehicleResponse;

import java.util.List;

public interface VehicleService {

    List<VehicleResponse> getVehiclesByCustomer(Long customerId);

    VehicleResponse createVehicle(
            Long customerId,
            VehicleRequest request
    );

    VehicleResponse updateVehicle(
            Long vehicleId,
            VehicleRequest request
    );

void deleteVehicle(Long vehicleId);

    VehicleResponse setDefaultVehicle(
            Long vehicleId,
            Long customerId
    );
}