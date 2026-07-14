package com.autowashpro.mapper;

import com.autowashpro.dto.request.RegisterRequest;
import com.autowashpro.dto.response.LoginCustomerResponse;
import com.autowashpro.dto.response.RegisterResponse;
import com.autowashpro.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Mapper(componentModel = "spring", imports = {BigDecimal.class, LocalDateTime.class})
public interface AuthMapper {

    @Mapping(target = "customerId", ignore = true)
    @Mapping(target = "phone", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "fullName", source = "name")
    @Mapping(target = "tier", constant = "Member")
    @Mapping(target = "role", constant = "CUSTOMER")
    @Mapping(target = "accumulatedPoints", constant = "0")
    @Mapping(target = "totalSpent", expression = "java(BigDecimal.ZERO)")
    @Mapping(target = "totalWashes", constant = "0")
    @Mapping(target = "createdAt", expression = "java(LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(LocalDateTime.now())")
    Customer toCustomer(RegisterRequest request);

    @Mapping(target = "success", constant = "true")
    @Mapping(target = "customerId", expression = "java(String.valueOf(customer.getCustomerId()))")
    RegisterResponse toRegisterResponse(Customer customer);

    @Mapping(target = "id", expression = "java(String.valueOf(customer.getCustomerId()))")
    @Mapping(target = "name", source = "fullName")
    @Mapping(target = "totalSpend", expression = "java(customer.getTotalSpent().longValue())")
    LoginCustomerResponse toLoginCustomerResponse(Customer customer);
}
