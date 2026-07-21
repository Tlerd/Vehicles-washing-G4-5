package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Payment;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.PaymentRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Test
    void findByBookingBookingId_returnsPersistedPayment() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Payment Test Branch"));
        Customer customer = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333004"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customer, "51A-44444"));
        Booking booking = bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-TESTC1"));

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setProvider("VNPAY");
        payment.setAmount(new BigDecimal("200000"));
        payment.setStatus("PENDING");
        payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.saveAndFlush(payment);

        List<Payment> payments = paymentRepository.findByBookingBookingId(booking.getBookingId());

        assertThat(payments).hasSize(1);
        assertThat(payments.get(0).getProvider()).isEqualTo("VNPAY");
        assertThat(payments.get(0).getStatus()).isEqualTo("PENDING");
        assertThat(payments.get(0).getAmount()).isEqualByComparingTo("200000");
    }
}
