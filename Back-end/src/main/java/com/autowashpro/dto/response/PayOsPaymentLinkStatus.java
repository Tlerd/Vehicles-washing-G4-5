package com.autowashpro.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PayOsPaymentLinkStatus {
    private String status;
    private long amountPaid;
    private String cancellationReason;
}
