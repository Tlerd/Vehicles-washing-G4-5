package com.autowashpro.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    @Schema(description = "Customer full name", example = "John Doe")
    private String name;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Schema(description = "Phone number in E.164 format", example = "+84901234567")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6 đến 100 ký tự")
    @Schema(description = "Account password", example = "secret123")
    private String password;

    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    @Schema(description = "Optional email address", example = "john@example.com")
    private String email;
}
