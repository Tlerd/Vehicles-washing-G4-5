package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vouchers")
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "voucher_id")
    private Long voucherId;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "voucher_code", nullable = false, unique = true, length = 50)
    private String voucherCode;

    @Column(name = "voucher_type", length = 50)
    private String voucherType;

    @Column(name = "discount_amount")
    private BigDecimal discountAmount;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "expired_at")
    private LocalDate expiredAt;

    @Column(name = "redeemed_at")
    private LocalDateTime redeemedAt;
}