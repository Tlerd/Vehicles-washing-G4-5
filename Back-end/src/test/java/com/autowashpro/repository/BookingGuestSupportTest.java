package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Guest;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.GuestRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BookingGuestSupportTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private GuestRepository guestRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Test
    void save_bookingWithGuestAndNoCustomer_persistsSuccessfully() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Guest Booking Test Branch"));
        Customer vehicleOwner = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333005"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(vehicleOwner, "51A-55555"));

        Guest guest = new Guest();
        guest.setFullName("Guest Booker");
        guest.setPhone("+84911333006");
        guest.setCreatedAt(LocalDateTime.now());
        guest = guestRepository.saveAndFlush(guest);

        Booking booking = BookingTestFixtures.newBooking(vehicleOwner, vehicle, branch, "AWP-TESTE1");
        booking.setCustomer(null);
        booking.setGuest(guest);

        Booking saved = bookingRepository.saveAndFlush(booking);

        assertThat(saved.getBookingId()).isNotNull();
        assertThat(saved.getCustomer()).isNull();
        assertThat(saved.getGuest().getGuestId()).isEqualTo(guest.getGuestId());
    }

    @Test
    void save_bookingWithNeitherCustomerNorGuest_violatesCheckConstraint() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Guest Booking Test Branch 2"));
        Customer vehicleOwner = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333007"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(vehicleOwner, "51A-66666"));

        Booking booking = BookingTestFixtures.newBooking(vehicleOwner, vehicle, branch, "AWP-TESTE2");
        booking.setCustomer(null);

        assertThatThrownBy(() -> bookingRepository.saveAndFlush(booking))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void save_bookingWithBothCustomerAndGuest_violatesCheckConstraint() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Guest Booking Test Branch 3"));
        Customer customer = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333008"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customer, "51A-77777"));

        Guest guest = new Guest();
        guest.setFullName("Guest Booker 2");
        guest.setPhone("+84911333009");
        guest.setCreatedAt(LocalDateTime.now());
        guest = guestRepository.saveAndFlush(guest);

        Booking booking = BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-TESTE3");
        booking.setGuest(guest);

        assertThatThrownBy(() -> bookingRepository.saveAndFlush(booking))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
