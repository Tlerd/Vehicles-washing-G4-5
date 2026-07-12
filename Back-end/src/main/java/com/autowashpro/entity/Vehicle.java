package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Long vehicleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "license_plate", nullable = false, length = 20)
    private String licensePlate;

    @Column(name = "brand", nullable = false, length = 50)
    private String brand;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_size", nullable = false, length = 20)
    private VehicleSize vehicleSize;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "notes", length = 255)
    private String notes;
}