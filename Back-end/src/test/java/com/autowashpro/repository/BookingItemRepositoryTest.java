package com.autowashpro.repository;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.BookingItem;
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.repository.BookingItemRepository;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.BranchRepository;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.repository.ServiceRepository;
import com.autowashpro.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BookingItemRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private BookingItemRepository bookingItemRepository;

    @Test
    void findByBookingBookingId_returnsSnapshottedLineItem() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Booking Item Test Branch"));
        Customer customer = customerRepository.saveAndFlush(BookingTestFixtures.newCustomer("+84911333003"));
        Vehicle vehicle = vehicleRepository.saveAndFlush(BookingTestFixtures.newVehicle(customer, "51A-33333"));
        Booking booking = bookingRepository.saveAndFlush(BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-TESTB1"));

        com.autowashpro.entity.Service service = new com.autowashpro.entity.Service();
        service.setServiceCode("TESTWASH");
        service.setServiceName("Test Wash");
        service.setBasePrice(new BigDecimal("100000"));
        service.setDurationMinutes(20);
        service.setStatus("ACTIVE");
        service = serviceRepository.saveAndFlush(service);

        BookingItem item = new BookingItem();
        item.setBooking(booking);
        item.setService(service);
        item.setQuantity(1);
        item.setUnitPrice(new BigDecimal("100000"));
        item.setSizeMultiplier(new BigDecimal("1.20"));
        item.setLineTotal(new BigDecimal("120000"));
        item.setDurationMinutes(20);
        item.setBufferMinutes(10);
        item.setCreatedAt(LocalDateTime.now());
        bookingItemRepository.saveAndFlush(item);

        List<BookingItem> items = bookingItemRepository.findByBookingBookingId(booking.getBookingId());

        assertThat(items).hasSize(1);
        assertThat(items.get(0).getLineTotal()).isEqualByComparingTo("120000");
        assertThat(items.get(0).getSizeMultiplier()).isEqualByComparingTo("1.20");
        assertThat(items.get(0).getDurationMinutes()).isEqualTo(20);
        assertThat(items.get(0).getBufferMinutes()).isEqualTo(10);
    }
}
