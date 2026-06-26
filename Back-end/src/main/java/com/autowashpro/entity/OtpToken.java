package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "otp_tokens")
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "otp_id")
    private Long otpId;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "otp_code", nullable = false, length = 6)
    private String otpCode;

    @Column(name = "verification_sid", length = 100)
    private String verificationSid;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}