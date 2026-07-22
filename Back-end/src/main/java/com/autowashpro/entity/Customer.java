package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone", nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "email", unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "tier", nullable = false, length = 20)
    private String tier = "MEMBER";

    @Column(name = "role", nullable = false, length = 20)
    private String role = "CUSTOMER";

    @Column(name = "accumulated_points", nullable = false)
    private Integer accumulatedPoints = 0;

    @Column(name = "total_spent", nullable = false)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "total_washes", nullable = false)
    private Integer totalWashes = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "no_show_count", nullable = false)
    private Integer noShowCount = 0;

    @Column(name = "requires_full_prepay", nullable = false)
    private Boolean requiresFullPrepay = false;

    @OneToMany(mappedBy = "customer")
    private List<Vehicle> vehicles;
}
