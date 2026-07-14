package com.autowashpro.dto.loyalty;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data public class RedeemVoucherRequest {
    @NotNull private Long customerId;
    @NotBlank private String voucherType;
    @NotNull @Positive private Integer pointsCost;
}
