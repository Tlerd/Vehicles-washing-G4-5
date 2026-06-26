package com.autowashpro.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class CustomerResponse {

    private Long customerId;
    private String fullName;
    private String phone;
    private String email;
    private String tier;
    private Integer accumulatedPoints;
    private BigDecimal totalSpent;
    private Integer totalWashes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}