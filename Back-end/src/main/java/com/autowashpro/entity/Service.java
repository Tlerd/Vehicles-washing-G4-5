package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "services")
public class Service {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "service_id")
    private Long serviceId;

    @Column(name = "service_code", nullable = false, unique = true, length = 30)
    private String serviceCode;

    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "status", nullable = false, length = 20)
    private String status;
}