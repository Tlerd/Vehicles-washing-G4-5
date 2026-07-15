package com.autowashpro.dto.admin;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
@Data public class CampaignRequest {
 @NotBlank private String name;
 @NotBlank private String goal;
 @NotNull @DecimalMin("1.0") @DecimalMax("5.0") private BigDecimal multiplier;
 @NotBlank private String targetTier;
 @NotNull private LocalDate startDate;
 @NotNull private LocalDate endDate;
}
