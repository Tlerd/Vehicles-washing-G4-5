package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "guests")
public class Guest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "guest_id")
    private Long guestId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone", nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    @Column(name = "vehicle_brand", length = 100)
    private String vehicleBrand;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_size", length = 20)
    private VehicleSize vehicleSize;

    @ManyToOne
    @JoinColumn(name = "merged_customer_id")
    private Customer mergedCustomer;

    @Column(name = "merged_at")
    private LocalDateTime mergedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
