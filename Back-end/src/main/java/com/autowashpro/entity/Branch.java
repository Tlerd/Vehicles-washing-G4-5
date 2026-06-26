package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "branches")
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "branch_name", nullable = false, length = 100)
    private String branchName;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    @Column(name = "status", nullable = false, length = 20)
    private String status;
}