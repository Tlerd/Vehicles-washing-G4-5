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

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "license_plate", nullable = false, length = 20)
    private String licensePlate;

    @Column(name = "brand", length = 50)
    private String brand;

    @Column(name = "model", length = 50)
    private String model;

    @Column(name = "vehicle_size", nullable = false, length = 20)
    private String vehicleSize;

    @Column(name = "color", length = 30)
    private String color;

    @Column(name = "is_default")
    private Boolean isDefault;

    @Column(name = "notes", length = 255)
    private String notes;
}