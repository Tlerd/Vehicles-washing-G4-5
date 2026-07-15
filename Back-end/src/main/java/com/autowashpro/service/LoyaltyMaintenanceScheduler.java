package com.autowashpro.service;

import com.autowashpro.entity.Booking;
import com.autowashpro.entity.Customer;
import com.autowashpro.repository.BookingRepository;
import com.autowashpro.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service @RequiredArgsConstructor
public class LoyaltyMaintenanceScheduler {
    private final LoyaltyService loyalty;
    private final CustomerRepository customers;
    private final BookingRepository bookings;

    @Scheduled(cron="0 10 0 * * *", zone="Asia/Ho_Chi_Minh")
    public void expirePointsDaily(){ loyalty.expireOldPoints(); }

    @Scheduled(cron="0 0 0 1 * *", zone="Asia/Ho_Chi_Minh") @Transactional
    public void reviewTiersMonthly(){
        LocalDate from=LocalDate.now().minusDays(365);
        for(Customer customer:customers.findAll()){
            if(!"CUSTOMER".equals(customer.getRole())) continue;
            List<Booking> completed=bookings.findByCustomerCustomerIdAndStatusAndBookingDateGreaterThanEqual(customer.getCustomerId(),"COMPLETED",from);
            int washes=completed.size(); BigDecimal spent=completed.stream().map(Booking::getTotalPrice).reduce(BigDecimal.ZERO,BigDecimal::add);
            customer.setTotalWashes(washes); customer.setTotalSpent(spent);
            customer.setTier(washes>=30||spent.compareTo(new BigDecimal("15000000"))>=0?"Platinum":washes>=15||spent.compareTo(new BigDecimal("6000000"))>=0?"Gold":washes>=5||spent.compareTo(new BigDecimal("2000000"))>=0?"Silver":"Member");
            customer.setUpdatedAt(LocalDateTime.now()); customers.save(customer);
        }
    }
}
