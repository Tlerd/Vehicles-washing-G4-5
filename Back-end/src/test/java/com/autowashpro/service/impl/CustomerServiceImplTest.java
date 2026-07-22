package com.autowashpro.service.impl;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.entity.Customer;
import com.autowashpro.exception.custom.BadRequestException;
import com.autowashpro.mapper.CustomerMapper;
import com.autowashpro.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerMapper customerMapper;

    @Test
    void createCustomer_requiresVerifiedRegistrationFlow() {
        CustomerRequest request = new CustomerRequest();

        assertThatThrownBy(() -> new CustomerServiceImpl(customerRepository, customerMapper)
                .createCustomer(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("verified registration");
    }

    @Test
    void updateCustomer_doesNotMassAssignServerOwnedLoyaltyFields() {
        Customer customer = new Customer();
        customer.setCustomerId(7L);
        customer.setFullName("Before");
        customer.setPhone("+84901111111");
        customer.setTier("GOLD");
        customer.setAccumulatedPoints(700);
        customer.setTotalSpent(new BigDecimal("7000000"));
        customer.setTotalWashes(17);

        CustomerRequest request = new CustomerRequest();
        request.setFullName("After");
        request.setPhone("+84902222222");
        request.setEmail("after@example.test");
        request.setTier("PLATINUM");
        request.setAccumulatedPoints(999999);
        request.setTotalSpent(new BigDecimal("999999999"));
        request.setTotalWashes(999);

        when(customerRepository.findById(7L)).thenReturn(Optional.of(customer));
        when(customerRepository.save(same(customer))).thenReturn(customer);
        when(customerMapper.toResponse(customer)).thenReturn(new CustomerResponse());

        new CustomerServiceImpl(customerRepository, customerMapper).updateCustomer(7L, request);

        assertThat(customer.getFullName()).isEqualTo("After");
        assertThat(customer.getTier()).isEqualTo("GOLD");
        assertThat(customer.getAccumulatedPoints()).isEqualTo(700);
        assertThat(customer.getTotalSpent()).isEqualByComparingTo("7000000");
        assertThat(customer.getTotalWashes()).isEqualTo(17);
    }
}
