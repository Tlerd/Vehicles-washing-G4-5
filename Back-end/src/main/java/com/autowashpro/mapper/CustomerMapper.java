package com.autowashpro.mapper;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
<<<<<<< HEAD
=======
import org.mapstruct.MappingTarget;
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da

@Mapper(componentModel = "spring")
public interface CustomerMapper {

<<<<<<< HEAD
    @Mapping(target = "customerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Customer toEntity(CustomerRequest request);

    CustomerResponse toResponse(Customer customer);
}
=======
@Mapper(componentModel = "spring", imports = LocalDateTime.class)
public interface CustomerMapper {

    @Mapping(target = "customerId", ignore = true)
    @Mapping(target = "createdAt", expression = "java(LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(LocalDateTime.now())")
    Customer toEntity(CustomerRequest request);

    CustomerResponse toResponse(Customer customer);

    @Mapping(target = "customerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(LocalDateTime.now())")
    void updateEntity(CustomerRequest request, @MappingTarget Customer customer);
}
>>>>>>> e6b1bb0fb506b1595ce8b4ec6bbf431d092962da
