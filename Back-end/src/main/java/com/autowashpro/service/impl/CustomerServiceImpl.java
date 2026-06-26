package com.autowashpro.service.impl;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.entity.Customer;
import com.autowashpro.mapper.CustomerMapper;
import com.autowashpro.repository.CustomerRepository;
import com.autowashpro.service.CustomerService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerServiceImpl(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Override
    public List<CustomerResponse> getAllCustomers() {
        return customerRepository.findAll()
                .stream()
                .map(CustomerMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        return CustomerMapper.toResponse(customer);
    }

    @Override
    public CustomerResponse createCustomer(CustomerRequest request) {
        Customer customer = CustomerMapper.toEntity(request);
        Customer savedCustomer = customerRepository.save(customer);

        return CustomerMapper.toResponse(savedCustomer);
    }

    @Override
    public CustomerResponse updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        customer.setFullName(request.getFullName());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setPasswordHash(request.getPasswordHash());
        customer.setTier(request.getTier());
        customer.setAccumulatedPoints(request.getAccumulatedPoints());
        customer.setTotalSpent(request.getTotalSpent());
        customer.setTotalWashes(request.getTotalWashes());
        customer.setUpdatedAt(LocalDateTime.now());

        Customer updatedCustomer = customerRepository.save(customer);

        return CustomerMapper.toResponse(updatedCustomer);
    }

    @Override
    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new RuntimeException("Customer not found with id: " + id);
        }

        customerRepository.deleteById(id);
    }
}