package com.autowashpro.repository;

import com.autowashpro.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {

}