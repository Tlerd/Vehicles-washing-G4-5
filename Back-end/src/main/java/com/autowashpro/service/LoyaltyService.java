package com.autowashpro.service;

import com.autowashpro.dto.loyalty.RedeemVoucherRequest;
import com.autowashpro.entity.*;
import com.autowashpro.exception.custom.*;
import com.autowashpro.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class LoyaltyService {
    private final CustomerRepository customerRepository;
    private final VoucherRepository voucherRepository;
    private final PointHistoryRepository pointHistoryRepository;

    public Voucher redeem(RedeemVoucherRequest r) {
        Customer c = customerRepository.findById(r.getCustomerId()).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (c.getAccumulatedPoints() < r.getPointsCost()) throw new BadRequestException("Insufficient loyalty points");
        BigDecimal discount = switch (r.getVoucherType().toUpperCase()) { case "DISCOUNT_50K" -> new BigDecimal("50000"); case "FREE_BASIC" -> new BigDecimal("100000"); case "FREE_DETAIL" -> new BigDecimal("250000"); default -> throw new BadRequestException("Unsupported voucher type"); };
        c.setAccumulatedPoints(c.getAccumulatedPoints() - r.getPointsCost()); c.setUpdatedAt(LocalDateTime.now()); customerRepository.save(c);
        Voucher v = new Voucher(); v.setCustomer(c); v.setVoucherCode("AWV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()); v.setVoucherType(r.getVoucherType().toUpperCase()); v.setDiscountAmount(discount); v.setStatus("ACTIVE"); v.setExpiredAt(LocalDate.now().plusMonths(3)); v = voucherRepository.save(v);
        PointHistory h = new PointHistory(); h.setCustomer(c); h.setPoints(-r.getPointsCost()); h.setActivityType("REDEEM"); h.setDescription("Redeemed " + v.getVoucherCode()); h.setCreatedAt(LocalDateTime.now()); pointHistoryRepository.save(h);
        return v;
    }
    @Transactional(readOnly = true) public List<Voucher> vouchers(Long customerId) { return voucherRepository.findByCustomerCustomerIdOrderByExpiredAtDesc(customerId); }
    @Transactional(readOnly = true) public List<PointHistory> history(Long customerId) { return pointHistoryRepository.findByCustomerCustomerIdOrderByCreatedAtDesc(customerId); }

    public int expireOldPoints() {
        List<PointHistory> old = pointHistoryRepository.findByActivityTypeAndCreatedAtBefore("EARN", LocalDateTime.now().minusMonths(12));
        int count = 0;
        for (PointHistory earn : old) {
            if (pointHistoryRepository.findByCustomerCustomerIdOrderByCreatedAtDesc(earn.getCustomer().getCustomerId()).stream().anyMatch(h -> "EXPIRE".equals(h.getActivityType()) && h.getDescription() != null && h.getDescription().endsWith("#" + earn.getPointHistoryId()))) continue;
            Customer c = earn.getCustomer(); int expired = Math.min(c.getAccumulatedPoints(), earn.getPoints());
            if (expired <= 0) continue;
            c.setAccumulatedPoints(c.getAccumulatedPoints() - expired); customerRepository.save(c);
            PointHistory h = new PointHistory(); h.setCustomer(c); h.setPoints(-expired); h.setActivityType("EXPIRE"); h.setDescription("12-month point expiration #" + earn.getPointHistoryId()); h.setCreatedAt(LocalDateTime.now()); pointHistoryRepository.save(h); count++;
        }
        return count;
    }
}
