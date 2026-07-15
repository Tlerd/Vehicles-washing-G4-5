package com.autowashpro.dto.booking;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data public class StatusRequest { @NotBlank private String status; }
