package com.autowashpro.repository;

import com.autowashpro.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    List<Voucher> findByCustomerCustomerIdOrderByExpiredAtDesc(Long customerId);
    Optional<Voucher> findByVoucherIdAndCustomerCustomerId(Long voucherId, Long customerId);
}
