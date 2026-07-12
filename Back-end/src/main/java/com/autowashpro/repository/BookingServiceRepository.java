package com.autowashpro.repository;

import com.autowashpro.entity.BookingService;
import com.autowashpro.entity.BookingServiceId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingServiceRepository extends JpaRepository<BookingService, BookingServiceId> {

}