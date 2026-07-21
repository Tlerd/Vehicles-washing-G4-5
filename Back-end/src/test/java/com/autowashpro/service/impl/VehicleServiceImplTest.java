package com.autowashpro.service.impl;

import com.autowashpro.dto.vehicle.VehicleRequest;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class VehicleServiceImplTest {

    @Mock private VehicleRepository vehicleRepository;
    @Mock private CustomerRepository customerRepository;

    private VehicleServiceImpl vehicleService;

    @BeforeEach
    void setUp() {
        vehicleService = new VehicleServiceImpl(vehicleRepository, customerRepository);
        lenient().when(vehicleRepository.findByVehicleIdAndCustomerCustomerId(99L, 1L))
                .thenReturn(Optional.empty());
    }

    @Test
    void updateVehicle_withVehicleNotOwnedByCaller_throwsForbidden() {
        VehicleRequest request = new VehicleRequest();
        request.setBrand("Toyota Vios");

        assertThatThrownBy(() -> vehicleService.updateVehicle(99L, 1L, request))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void deleteVehicle_withVehicleNotOwnedByCaller_throwsForbidden() {
        assertThatThrownBy(() -> vehicleService.deleteVehicle(99L, 1L))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void setDefaultVehicle_withVehicleNotOwnedByCaller_throwsForbidden() {
        assertThatThrownBy(() -> vehicleService.setDefaultVehicle(99L, 1L))
                .isInstanceOf(ForbiddenException.class);
    }
}
