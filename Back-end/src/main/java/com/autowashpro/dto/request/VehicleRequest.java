package com.autowashpro.dto.vehicle;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VehicleRequest {

    private Long customerId;

    private String licensePlate;

    private String brand;

    private String size;

    private String notes;

    private Boolean isDefault;
}