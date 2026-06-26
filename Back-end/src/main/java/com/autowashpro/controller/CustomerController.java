package com.autowashpro.controller;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@Tag(
        name = "Customer",
        description = "Customer Management APIs"
)
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @Operation(summary = "Get all customers")
    @GetMapping
    public List<CustomerResponse> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    @Operation(summary = "Get customer by ID")
    @GetMapping("/{id}")
    public CustomerResponse getCustomerById(@PathVariable Long id) {
        return customerService.getCustomerById(id);
    }

    @Operation(summary = "Create a new customer")
    @PostMapping
    public CustomerResponse createCustomer(@RequestBody CustomerRequest request) {
        return customerService.createCustomer(request);
    }

    @Operation(summary = "Update customer")
    @PutMapping("/{id}")
    public CustomerResponse updateCustomer(
            @PathVariable Long id,
            @RequestBody CustomerRequest request) {
        return customerService.updateCustomer(id, request);
    }

    @Operation(summary = "Delete customer")
    @DeleteMapping("/{id}")
    public void deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
    }
}