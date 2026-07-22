package com.autowashpro.repository;

import com.autowashpro.entity.Guest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GuestRepository extends JpaRepository<Guest, Long> {

    Optional<Guest> findByPhone(String phone);

    boolean existsByPhone(String phone);
}
