package com.autowashpro.service;

import com.autowashpro.dto.request.CustomerProfileUpdateRequest;
import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;

import java.util.List;

public interface CustomerService {

    List<CustomerResponse> getAllCustomers();

    CustomerResponse getCustomerById(Long id);

    CustomerResponse createCustomer(CustomerRequest request);

    CustomerResponse updateCustomer(Long id, CustomerRequest request);

    void deleteCustomer(Long id);

    CustomerResponse updateOwnProfile(Long id, CustomerProfileUpdateRequest request);
}