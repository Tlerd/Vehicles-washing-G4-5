package com.autowashpro.repository;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.SlotReservation;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SlotReservationRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private BayRepository bayRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SlotReservationRepository slotReservationRepository;

    @Test
    void save_secondReservationForSameBaySlotTime_violatesUniqueConstraint() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Slot Test Branch"));

        Bay bay = new Bay();
        bay.setBranch(branch);
        bay.setBayCode("Q1");
        bay.setBayType("QUICK");
        bay.setCreatedAt(LocalDateTime.now());
        bay = bayRepository.saveAndFlush(bay);

        Customer customerA = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333001"));
        Vehicle vehicleA = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customerA, "51A-11111"));
        Booking bookingA = bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customerA, vehicleA, branch, "AWP-TESTA1"));

        Customer customerB = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333002"));
        Vehicle vehicleB = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customerB, "51A-22222"));
        Booking bookingB = bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customerB, vehicleB, branch, "AWP-TESTA2"));

        LocalDateTime slotTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);

        SlotReservation first = new SlotReservation();
        first.setBranch(branch);
        first.setBay(bay);
        first.setSlotTime(slotTime);
        first.setBooking(bookingA);
        first.setStatus("HOLD");
        first.setExpiresAt(LocalDateTime.now().plusMinutes(15));
        slotReservationRepository.saveAndFlush(first);

        SlotReservation second = new SlotReservation();
        second.setBranch(branch);
        second.setBay(bay);
        second.setSlotTime(slotTime);
        second.setBooking(bookingB);
        second.setStatus("HOLD");
        second.setExpiresAt(LocalDateTime.now().plusMinutes(15));

        assertThatThrownBy(() -> slotReservationRepository.saveAndFlush(second))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
