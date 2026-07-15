package com.autowashpro.controller;

import com.autowashpro.dto.loyalty.RedeemVoucherRequest;
import com.autowashpro.entity.*;
import com.autowashpro.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController @RequestMapping("/api/v1/loyalty") @RequiredArgsConstructor
public class LoyaltyController {
    private final LoyaltyService loyalty;
    @PostMapping("/vouchers/redeem") public ResponseEntity<Voucher> redeem(@Valid @RequestBody RedeemVoucherRequest r,@AuthenticationPrincipal String callerId) { r.setCustomerId(Long.valueOf(callerId)); return ResponseEntity.status(HttpStatus.CREATED).body(loyalty.redeem(r)); }
    @GetMapping("/customers/{id}/vouchers") public List<Voucher> vouchers(@PathVariable Long id,@AuthenticationPrincipal String callerId) { return loyalty.vouchers(Long.valueOf(callerId)); }
    @GetMapping("/customers/{id}/points") public List<PointHistory> points(@PathVariable Long id,@AuthenticationPrincipal String callerId) { return loyalty.history(Long.valueOf(callerId)); }
    @PostMapping("/maintenance/expire-points") public Map<String, Integer> expire() { return Map.of("expiredTransactions", loyalty.expireOldPoints()); }
}
