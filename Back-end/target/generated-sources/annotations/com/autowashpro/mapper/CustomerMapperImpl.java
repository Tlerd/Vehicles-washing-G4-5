package com.autowashpro.mapper;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.entity.Customer;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-27T08:41:37+0700",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.100.v20260624-0231, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class CustomerMapperImpl implements CustomerMapper {

    @Override
    public Customer toEntity(CustomerRequest request) {
        if ( request == null ) {
            return null;
        }

        Customer customer = new Customer();

        customer.setAccumulatedPoints( request.getAccumulatedPoints() );
        customer.setEmail( request.getEmail() );
        customer.setFullName( request.getFullName() );
        customer.setPasswordHash( request.getPasswordHash() );
        customer.setPhone( request.getPhone() );
        customer.setTier( request.getTier() );
        customer.setTotalSpent( request.getTotalSpent() );
        customer.setTotalWashes( request.getTotalWashes() );

        return customer;
    }

    @Override
    public CustomerResponse toResponse(Customer customer) {
        if ( customer == null ) {
            return null;
        }

        CustomerResponse customerResponse = new CustomerResponse();

        customerResponse.setAccumulatedPoints( customer.getAccumulatedPoints() );
        customerResponse.setCreatedAt( customer.getCreatedAt() );
        customerResponse.setCustomerId( customer.getCustomerId() );
        customerResponse.setEmail( customer.getEmail() );
        customerResponse.setFullName( customer.getFullName() );
        customerResponse.setPhone( customer.getPhone() );
        customerResponse.setTier( customer.getTier() );
        customerResponse.setTotalSpent( customer.getTotalSpent() );
        customerResponse.setTotalWashes( customer.getTotalWashes() );
        customerResponse.setUpdatedAt( customer.getUpdatedAt() );

        return customerResponse;
    }
}
