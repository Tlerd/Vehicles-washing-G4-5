package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "promotions")
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "promotion_id")
    private Long promotionId;

    @Column(name = "promotion_name", nullable = false, length = 100)
    private String promotionName;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "discount_percent")
    private BigDecimal discountPercent;

    @Column(name = "target_tier", length = 20)
    private String targetTier;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;
}