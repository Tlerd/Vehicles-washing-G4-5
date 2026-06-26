package com.autowashpro.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CustomerRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    @Schema(description = "Customer full name", example = "Nguyen Van A")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại không hợp lệ")
    @Schema(description = "Phone number", example = "+84901234567")
    private String phone;

    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    @Schema(description = "Email address", example = "customer@example.com")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(max = 255, message = "Mật khẩu không hợp lệ")
    @Schema(description = "Hashed password", example = "$2a$10$...")
    private String passwordHash;

    @NotBlank(message = "Hạng thành viên không được để trống")
    @Size(max = 20, message = "Hạng thành viên không hợp lệ")
    @Schema(description = "Loyalty tier", example = "Member")
    private String tier;

    @Schema(description = "Accumulated loyalty points", example = "0")
    private Integer accumulatedPoints;

    @Schema(description = "Total amount spent", example = "0.00")
    private BigDecimal totalSpent;

    @Schema(description = "Total number of washes", example = "0")
    private Integer totalWashes;
}
