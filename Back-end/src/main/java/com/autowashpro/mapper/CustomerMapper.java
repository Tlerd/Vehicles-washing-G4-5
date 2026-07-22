package com.autowashpro.mapper;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.entity.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CustomerMapper {

    @Mapping(target = "customerId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
<<<<<<< HEAD
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "tier", ignore = true)
    @Mapping(target = "accumulatedPoints", ignore = true)
    @Mapping(target = "totalSpent", ignore = true)
    @Mapping(target = "totalWashes", ignore = true)
    @Mapping(target = "noShowCount", ignore = true)
    @Mapping(target = "requiresFullPrepay", ignore = true)
    @Mapping(target = "vehicles", ignore = true)
=======
>>>>>>> 1a4749d53d08f657bcd129de981b4ddf3a383d4e
    Customer toEntity(CustomerRequest request);

    CustomerResponse toResponse(Customer customer);
}
