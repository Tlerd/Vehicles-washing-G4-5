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
<<<<<<< HEAD
import org.springframework.dao.DataIntegrityViolationException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
<<<<<<< HEAD
import static org.assertj.core.api.Assertions.assertThatThrownBy;
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e

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

<<<<<<< HEAD
    @PersistenceContext
    private EntityManager entityManager;

=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
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
<<<<<<< HEAD

    @Test
    void invalidQuantityAboveTrustedPolicy_isRejectedByDatabase() {
        ItemFixture fixture = fixture("INVALIDQ");
        BookingItem item = item(fixture, 21);

        assertThatThrownBy(() -> bookingItemRepository.saveAndFlush(item))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("CK_booking_items_v2");
        entityManager.clear();
    }

    @Test
    void duplicateBookingServiceSnapshot_isRejectedByDatabase() {
        ItemFixture fixture = fixture("DUPLICATE");
        bookingItemRepository.saveAndFlush(item(fixture, 1));

        assertThatThrownBy(() -> bookingItemRepository.saveAndFlush(item(fixture, 1)))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("UX_booking_items_booking_service");
        entityManager.clear();
    }

    private ItemFixture fixture(String suffix) {
        String unique = suffix + System.nanoTime();
        Branch branch = branchRepository.saveAndFlush(
                BookingTestFixtures.newBranch("Item " + unique));
        Customer customer = customerRepository.saveAndFlush(
                BookingTestFixtures.newCustomer("+849" + Math.abs(unique.hashCode())));
        Vehicle vehicle = vehicleRepository.saveAndFlush(
                BookingTestFixtures.newVehicle(customer, "T-" + Math.abs(unique.hashCode())));
        Booking booking = bookingRepository.saveAndFlush(
                BookingTestFixtures.newBooking(customer, vehicle, branch, "AWP-" + unique));
        com.autowashpro.entity.Service service = new com.autowashpro.entity.Service();
        service.setServiceCode(unique.substring(0, Math.min(30, unique.length())));
        service.setServiceName("Test " + suffix);
        service.setBasePrice(new BigDecimal("100000"));
        service.setDurationMinutes(20);
        service.setStatus("ACTIVE");
        service = serviceRepository.saveAndFlush(service);
        return new ItemFixture(booking, service);
    }

    private BookingItem item(ItemFixture fixture, int quantity) {
        BookingItem item = new BookingItem();
        item.setBooking(fixture.booking());
        item.setService(fixture.service());
        item.setQuantity(quantity);
        item.setUnitPrice(new BigDecimal("100000"));
        item.setSizeMultiplier(BigDecimal.ONE);
        item.setLineTotal(new BigDecimal("100000").multiply(BigDecimal.valueOf(quantity)));
        item.setDurationMinutes(20);
        item.setBufferMinutes(10);
        item.setCreatedAt(LocalDateTime.now());
        return item;
    }

    private record ItemFixture(
            Booking booking, com.autowashpro.entity.Service service) {
    }
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
}
