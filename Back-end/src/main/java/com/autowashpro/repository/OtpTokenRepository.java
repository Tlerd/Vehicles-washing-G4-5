package com.autowashpro.repository;

import com.autowashpro.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

    Optional<OtpToken> findTopByPhoneAndIsVerifiedTrueOrderByCreatedAtDesc(String phone);

    Optional<OtpToken> findTopByPhoneOrderByCreatedAtDesc(String phone);

    long countByPhoneAndCreatedAtAfter(String phone, LocalDateTime createdAt);
}