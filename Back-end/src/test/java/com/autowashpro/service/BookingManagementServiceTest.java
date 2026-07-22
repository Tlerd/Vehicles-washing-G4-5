package com.autowashpro.service;

import com.autowashpro.dto.booking.CreateBookingRequest;
<<<<<<< HEAD
import com.autowashpro.entity.Booking;
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
import com.autowashpro.entity.Branch;
import com.autowashpro.entity.Customer;
import com.autowashpro.entity.Vehicle;
import com.autowashpro.entity.VehicleSize;
import com.autowashpro.exception.custom.ForbiddenException;
import com.autowashpro.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

<<<<<<< HEAD
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
=======
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingManagementServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private VehicleRepository vehicleRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private ServiceRepository serviceRepository;
    @Mock private BookingServiceRepository bookingServiceRepository;
    @Mock private VoucherRepository voucherRepository;
    @Mock private PointHistoryRepository pointHistoryRepository;
    @Mock private PromotionRepository promotionRepository;

    private BookingManagementService bookingManagementService;

    @BeforeEach
    void setUp() {
        bookingManagementService = new BookingManagementService(
                bookingRepository, customerRepository, vehicleRepository, branchRepository,
                serviceRepository, bookingServiceRepository, voucherRepository,
                pointHistoryRepository, promotionRepository);
    }

    @Test
    void create_withVehicleNotOwnedByCaller_throwsForbidden() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(new Customer()));
        when(bookingRepository.existsByCustomerCustomerIdAndStatusIn(1L, List.of("PENDING", "CONFIRMED")))
                .thenReturn(false);
        when(vehicleRepository.findByVehicleIdAndCustomerCustomerId(99L, 1L)).thenReturn(Optional.empty());

        CreateBookingRequest request = new CreateBookingRequest();
        request.setCustomerId(1L);
        request.setVehicleId(99L);
        request.setBranchId(1L);
        request.setServiceCodes(List.of("WASH"));
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setBookingTime(LocalTime.of(9, 0));

        assertThatThrownBy(() -> bookingManagementService.create(request))
                .isInstanceOf(ForbiddenException.class);
    }

    @Test
    void create_withVoucherNotOwnedByCaller_throwsForbidden() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(new Customer()));
        when(bookingRepository.existsByCustomerCustomerIdAndStatusIn(1L, List.of("PENDING", "CONFIRMED")))
                .thenReturn(false);

        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleId(99L);
        vehicle.setVehicleSize(VehicleSize.SEDAN);
        when(vehicleRepository.findByVehicleIdAndCustomerCustomerId(99L, 1L)).thenReturn(Optional.of(vehicle));

        Branch branch = new Branch();
        branch.setBranchId(1L);
        branch.setStatus("ACTIVE");
        branch.setOpenTime(LocalTime.of(7, 0));
        branch.setCloseTime(LocalTime.of(18, 0));
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));

        com.autowashpro.entity.Service service = new com.autowashpro.entity.Service();
        service.setServiceId(1L);
        service.setServiceCode("WASH");
        service.setBasePrice(new BigDecimal("100000"));
        service.setDurationMinutes(30);
        service.setStatus("ACTIVE");
        when(serviceRepository.findByServiceCodeIn(List.of("WASH"))).thenReturn(List.of(service));

        when(bookingRepository.findByBranchBranchIdAndBookingDateAndStatusNot(eq(1L), any(LocalDate.class), eq("CANCELLED")))
                .thenReturn(List.of());

        when(voucherRepository.findByVoucherIdAndCustomerCustomerId(5L, 1L)).thenReturn(Optional.empty());

        CreateBookingRequest request = new CreateBookingRequest();
        request.setCustomerId(1L);
        request.setVehicleId(99L);
        request.setBranchId(1L);
        request.setServiceCodes(List.of("WASH"));
        request.setBookingDate(LocalDate.now().plusDays(1));
        request.setBookingTime(LocalTime.of(9, 0));
        request.setVoucherId(5L);

        assertThatThrownBy(() -> bookingManagementService.create(request))
                .isInstanceOf(ForbiddenException.class);
    }
<<<<<<< HEAD

=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
}
