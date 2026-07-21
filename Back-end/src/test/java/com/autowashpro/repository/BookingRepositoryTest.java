package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class BookingRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    void findByBookingRef_existingRef_returnsBooking() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Lookup Test Branch"));
        Customer customer = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333010"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customer, "51A-88888"));
        bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-LOOKUP1"));

        Optional<Booking> found = bookingRepository.findByBookingRef("AWP-LOOKUP1");

        assertThat(found).isPresent();
        assertThat(found.get().getBookingRef()).isEqualTo("AWP-LOOKUP1");
    }

    @Test
    void findByBookingRef_unknownRef_returnsEmpty() {
        assertThat(bookingRepository.findByBookingRef("AWP-DOES-NOT-EXIST")).isEmpty();
    }
}
