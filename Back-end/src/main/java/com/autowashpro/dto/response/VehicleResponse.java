package com.autowashpro.dto.vehicle;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class VehicleResponse {

    private Long id;

    private Long customerId;

    private String licensePlate;

    private String brand;

    private String size;

    private String notes;

    private Boolean isDefault;
}