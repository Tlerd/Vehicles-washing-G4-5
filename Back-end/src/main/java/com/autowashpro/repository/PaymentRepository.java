package com.autowashpro.repository;

import com.autowashpro.entity.Payment;
<<<<<<< HEAD
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
=======
import org.springframework.data.jpa.repository.JpaRepository;
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByBookingBookingId(Long bookingId);
<<<<<<< HEAD

    @Query(value = "SELECT * FROM dbo.payments " +
            "WITH (UPDLOCK, HOLDLOCK, ROWLOCK, INDEX(IX_payments_booking)) " +
            "WHERE booking_id = :bookingId ORDER BY payment_id", nativeQuery = true)
    @QueryHints(@QueryHint(name = "jakarta.persistence.query.timeout", value = "2000"))
    List<Payment> findByBookingIdForUpdate(@Param("bookingId") Long bookingId);
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
}
