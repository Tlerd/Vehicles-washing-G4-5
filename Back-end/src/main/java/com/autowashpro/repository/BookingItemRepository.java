package com.autowashpro.repository;

import com.autowashpro.entity.BookingItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingItemRepository extends JpaRepository<BookingItem, Long> {

    List<BookingItem> findByBookingBookingId(Long bookingId);
}
