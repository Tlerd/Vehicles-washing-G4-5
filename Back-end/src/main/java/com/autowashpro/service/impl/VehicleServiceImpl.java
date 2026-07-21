package com.autowashpro.service.impl;

import com.autowashpro.dto.vehicle.VehicleRequest;
import com.autowashpro.dto.vehicle.VehicleResponse;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.VehicleRepository;
import com.autowashpro.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehiclesByCustomer(Long customerId) {

        if (!customerRepository.existsById(customerId)) {
            throw new RuntimeException("Customer not found.");
        }

        return vehicleRepository.findByCustomerCustomerId(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public VehicleResponse createVehicle(
            Long customerId,
            VehicleRequest request
    ) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found."));

        validateCreateRequest(request);

        String normalizedPlate =
                normalizeLicensePlate(request.getLicensePlate());

        boolean plateExists =
                vehicleRepository
                        .existsByCustomerCustomerIdAndLicensePlateIgnoreCase(
                                customerId,
                                normalizedPlate
                        );

        if (plateExists) {
            throw new RuntimeException(
                    "This license plate already exists for this customer."
            );
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setCustomer(customer);
        vehicle.setLicensePlate(normalizedPlate);
        vehicle.setBrand(request.getBrand().trim());
        vehicle.setVehicleSize(
                VehicleSize.valueOf(request.getSize().toUpperCase())
        );
        vehicle.setNotes(normalizeNotes(request.getNotes()));

        boolean hasNoVehicle =
                vehicleRepository.countByCustomerCustomerId(customerId) == 0;

        boolean shouldBeDefault =
                hasNoVehicle || Boolean.TRUE.equals(request.getIsDefault());

        if (shouldBeDefault) {
            clearCurrentDefault(customerId);
        }

        vehicle.setIsDefault(shouldBeDefault);

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        return toResponse(savedVehicle);
    }

    @Override
    public VehicleResponse updateVehicle(
            Long vehicleId,
            Long customerId,
            VehicleRequest request
    ) {
        Vehicle vehicle = findOwnedVehicle(vehicleId, customerId);

        if (request == null) {
            throw new RuntimeException("Vehicle request is required.");
        }

        if (request.getLicensePlate() != null
                && !request.getLicensePlate().isBlank()) {

            String normalizedPlate =
                    normalizeLicensePlate(request.getLicensePlate());

            validateLicensePlate(normalizedPlate);

            boolean plateChanged =
                    !vehicle.getLicensePlate()
                            .equalsIgnoreCase(normalizedPlate);

            if (plateChanged) {
               

                boolean plateExists =
                        vehicleRepository
                                .existsByCustomerCustomerIdAndLicensePlateIgnoreCase(
                                        customerId,
                                        normalizedPlate
                                );

                if (plateExists) {
                    throw new RuntimeException(
                            "This license plate already exists for this customer."
                    );
                }

                vehicle.setLicensePlate(normalizedPlate);
            }
        }

        if (request.getBrand() != null
                && !request.getBrand().isBlank()) {
            vehicle.setBrand(request.getBrand().trim());
        }

        if (request.getSize() != null
                && !request.getSize().isBlank()) {

            try {
                vehicle.setVehicleSize(
                        VehicleSize.valueOf(
                                request.getSize().toUpperCase()
                        )
                );
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid vehicle size.");
            }
        }

        if (request.getNotes() != null) {
            if (request.getNotes().length() > 255) {
                throw new RuntimeException(
                        "Notes must not exceed 255 characters."
                );
            }

            vehicle.setNotes(normalizeNotes(request.getNotes()));
        }

        if (Boolean.TRUE.equals(request.getIsDefault())) {
           

            clearCurrentDefault(customerId);
            vehicle.setIsDefault(true);
        }

        Vehicle updatedVehicle = vehicleRepository.save(vehicle);

        return toResponse(updatedVehicle);
    }

    @Override
public void deleteVehicle(Long vehicleId, Long customerId) {

    Vehicle vehicle = findOwnedVehicle(vehicleId, customerId);

    long totalVehicles =
            vehicleRepository.countByCustomerCustomerId(customerId);

    if (totalVehicles <= 1) {
        throw new RuntimeException(
                "You must maintain at least one default vehicle profile for booking."
        );
    }

    boolean wasDefault = Boolean.TRUE.equals(vehicle.getIsDefault());

    vehicleRepository.delete(vehicle);
    vehicleRepository.flush();

    if (wasDefault) {
        List<Vehicle> remainingVehicles =
                vehicleRepository.findByCustomerCustomerId(customerId);

        if (!remainingVehicles.isEmpty()) {
            Vehicle newDefault = remainingVehicles.get(0);
            newDefault.setIsDefault(true);
            vehicleRepository.save(newDefault);
        }
    }
}

    @Override
    public VehicleResponse setDefaultVehicle(
            Long vehicleId,
            Long customerId
    ) {
        Vehicle vehicle = findOwnedVehicle(vehicleId, customerId);

        clearCurrentDefault(customerId);

        vehicle.setIsDefault(true);

        Vehicle updatedVehicle = vehicleRepository.save(vehicle);

        return toResponse(updatedVehicle);
    }

    private Vehicle findOwnedVehicle(
            Long vehicleId,
            Long customerId
    ) {
        return vehicleRepository
                .findByVehicleIdAndCustomerCustomerId(
                        vehicleId,
                        customerId
                )
                .orElseThrow(
                        () -> new ForbiddenException(
                                "Unauthorized vehicle access or vehicle not found."
                        )
                );
    }

    private void clearCurrentDefault(Long customerId) {

        List<Vehicle> vehicles =
                vehicleRepository.findByCustomerCustomerId(customerId);

        for (Vehicle vehicle : vehicles) {
            if (Boolean.TRUE.equals(vehicle.getIsDefault())) {
                vehicle.setIsDefault(false);
            }
        }

        vehicleRepository.saveAll(vehicles);
    }

    private void validateCreateRequest(VehicleRequest request) {

        if (request == null) {
            throw new RuntimeException("Vehicle request is required.");
        }

        if (request.getLicensePlate() == null
                || request.getLicensePlate().isBlank()) {
            throw new RuntimeException("License plate is required.");
        }

        if (request.getBrand() == null
                || request.getBrand().isBlank()) {
            throw new RuntimeException("Brand / Model is required.");
        }

        if (request.getSize() == null
                || request.getSize().isBlank()) {
            throw new RuntimeException("Vehicle size is required.");
        }

        try {
            VehicleSize.valueOf(request.getSize().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid vehicle size.");
        }

        if (request.getNotes() != null
                && request.getNotes().length() > 255) {
            throw new RuntimeException(
                    "Notes must not exceed 255 characters."
            );
        }

        validateLicensePlate(
                normalizeLicensePlate(request.getLicensePlate())
        );
    }

    private void validateLicensePlate(String licensePlate) {

        String plateRegex =
                "^[0-9]{2}[A-Z]-[0-9]{3}\\.?[0-9]{2}$";

        if (!licensePlate.matches(plateRegex)) {
            throw new RuntimeException(
                    "Invalid license plate format."
            );
        }
    }

    private String normalizeLicensePlate(String licensePlate) {
        return licensePlate
                .trim()
                .toUpperCase()
                .replaceAll("\\s+", "");
    }

    private String normalizeNotes(String notes) {
        if (notes == null || notes.isBlank()) {
            return null;
        }

        return notes.trim();
    }

    private VehicleResponse toResponse(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getVehicleId(),
                vehicle.getCustomer().getCustomerId(),
                vehicle.getLicensePlate(),
                vehicle.getBrand(),
                vehicle.getVehicleSize().name().toLowerCase(),
                vehicle.getNotes(),
                vehicle.getIsDefault()
        );
    }
}
