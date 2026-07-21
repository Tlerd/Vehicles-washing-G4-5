package com.autowashpro.repository;

import com.autowashpro.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhone(String phone);

    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    List<Customer> findByFullNameContainingIgnoreCaseOrPhoneContainingIgnoreCase(String name, String phone);
}
