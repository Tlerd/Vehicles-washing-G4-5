package com.autowashpro.dto.request;

<<<<<<< HEAD
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
=======
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CustomerRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
<<<<<<< HEAD
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)(3|5|7|8|9)[0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam")
=======
    @Schema(description = "Customer full name", example = "Nguyen Van A")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(max = 20, message = "Số điện thoại không hợp lệ")
    @Schema(description = "Phone number", example = "+84901234567")
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
    private String phone;

    @Email(message = "Email không hợp lệ")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
<<<<<<< HEAD
    private String email;

=======
    @Schema(description = "Email address", example = "customer@example.com")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(max = 255, message = "Mật khẩu không hợp lệ")
    @Schema(description = "Hashed password", example = "$2a$10$...")
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
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
