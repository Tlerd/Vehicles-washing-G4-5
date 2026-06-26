package com.autowashpro.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class RegisterResponse {

    @Schema(example = "true")
    private boolean success;

    @Schema(description = "Created customer identifier")
    private String customerId;
}
