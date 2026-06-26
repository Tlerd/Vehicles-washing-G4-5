package com.autowashpro.mapper;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.entity.Customer;

import java.time.LocalDateTime;

public class CustomerMapper {

    public static Customer toEntity(CustomerRequest request) {
        Customer customer = new Customer();

        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setPasswordHash(request.getPasswordHash());
        customer.setTier(request.getTier());
        customer.setAccumulatedPoints(request.getAccumulatedPoints());
        customer.setTotalSpent(request.getTotalSpent());
        customer.setTotalWashes(request.getTotalWashes());
        customer.setCreatedAt(LocalDateTime.now());
        customer.setUpdatedAt(LocalDateTime.now());

        return customer;
    }

    public static CustomerResponse toResponse(Customer customer) {
        CustomerResponse response = new CustomerResponse();

        response.setCustomerId(customer.getCustomerId());
        response.setFullName(customer.getFullName());
        response.setPhone(customer.getPhone());
        response.setEmail(customer.getEmail());
        response.setTier(customer.getTier());
        response.setAccumulatedPoints(customer.getAccumulatedPoints());
        response.setTotalSpent(customer.getTotalSpent());
        response.setTotalWashes(customer.getTotalWashes());
        response.setCreatedAt(customer.getCreatedAt());
        response.setUpdatedAt(customer.getUpdatedAt());

        return response;
    }
}