package com.autowashpro.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CustomerRequest {

    private String fullName;
    private String phone;
    private String email;
    private String passwordHash;
    private String tier;
    private Integer accumulatedPoints;
    private BigDecimal totalSpent;
    private Integer totalWashes;
}