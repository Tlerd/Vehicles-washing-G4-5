package com.autowashpro.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {

    @Schema(description = "JWT access token valid for 24 hours")
    private String token;

    private LoginCustomerResponse customer;
}
