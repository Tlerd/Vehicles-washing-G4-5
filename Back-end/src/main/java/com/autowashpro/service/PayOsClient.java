package com.autowashpro.service;

import com.autowashpro.dto.response.PayOsPaymentLink;
import com.autowashpro.dto.response.PayOsPaymentLinkStatus;

import java.math.BigDecimal;

/** Real payOS payment-gateway client. No webhook receiver exists in this
 *  phase — payment status is only ever learned by explicitly calling
 *  {@link #getPaymentLinkInfo(long)}, never trusted from any other source. */
public interface PayOsClient {

    /** Creates a real, payable payOS payment link. {@code orderCode} must be
     *  a value the caller controls and can query/cancel later — this design
     *  uses the local {@code Payment} row's own auto-generated id. */
    PayOsPaymentLink createPaymentLink(long orderCode, BigDecimal amount, String description);

    /** Reads the real, current status of a previously created payment link. */
    PayOsPaymentLinkStatus getPaymentLinkInfo(long orderCode);

    /** Best-effort cancellation of a payment link. Callers must not assume
     *  this always succeeds — payOS itself may be unreachable. */
    void cancelPaymentLink(long orderCode, String reason);
}
