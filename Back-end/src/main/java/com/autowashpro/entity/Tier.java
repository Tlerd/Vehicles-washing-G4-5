package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tiers")
public class Tier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tier_id")
    private Long tierId;

    @Column(name = "tier_code", nullable = false, unique = true, length = 20)
    private String tierCode;

    @Column(name = "tier_rank", nullable = false, unique = true)
    private Integer tierRank;

    @Column(name = "booking_window_days", nullable = false)
    private Integer bookingWindowDays;

    @Column(name = "points_multiplier", nullable = false, precision = 4, scale = 2)
    private BigDecimal pointsMultiplier;

    @Column(name = "deposit_waived", nullable = false)
    private Boolean depositWaived;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
