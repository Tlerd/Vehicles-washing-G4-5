package com.autowashpro.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginCustomerResponse {

    @Schema(example = "1")
    private String id;

    @Schema(example = "John Doe")
    private String name;

    @Schema(example = "+84901234567")
    private String phone;

    @Schema(example = "Member")
    private String tier;
    private String role;

    @Schema(example = "150")
    private Integer accumulatedPoints;

    @Schema(example = "1200000")
    private Long totalSpend;
}
