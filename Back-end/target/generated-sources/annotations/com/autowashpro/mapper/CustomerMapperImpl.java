package com.autowashpro.mapper;

import com.autowashpro.dto.request.CustomerRequest;
import com.autowashpro.dto.response.CustomerResponse;
import com.autowashpro.entity.Customer;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-27T00:21:08+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.17 (Eclipse Adoptium)"
)
@Component
public class CustomerMapperImpl implements CustomerMapper {

    @Override
    public Customer toEntity(CustomerRequest request) {
        if ( request == null ) {
            return null;
        }

        Customer customer = new Customer();

        customer.setFullName( request.getFullName() );
        customer.setPhone( request.getPhone() );
        customer.setEmail( request.getEmail() );
        customer.setPasswordHash( request.getPasswordHash() );
        customer.setTier( request.getTier() );
        customer.setAccumulatedPoints( request.getAccumulatedPoints() );
        customer.setTotalSpent( request.getTotalSpent() );
        customer.setTotalWashes( request.getTotalWashes() );

        customer.setCreatedAt( LocalDateTime.now() );
        customer.setUpdatedAt( LocalDateTime.now() );

        return customer;
    }

    @Override
    public CustomerResponse toResponse(Customer customer) {
        if ( customer == null ) {
            return null;
        }

        CustomerResponse customerResponse = new CustomerResponse();

        customerResponse.setCustomerId( customer.getCustomerId() );
        customerResponse.setFullName( customer.getFullName() );
        customerResponse.setPhone( customer.getPhone() );
        customerResponse.setEmail( customer.getEmail() );
        customerResponse.setTier( customer.getTier() );
        customerResponse.setAccumulatedPoints( customer.getAccumulatedPoints() );
        customerResponse.setTotalSpent( customer.getTotalSpent() );
        customerResponse.setTotalWashes( customer.getTotalWashes() );
        customerResponse.setCreatedAt( customer.getCreatedAt() );
        customerResponse.setUpdatedAt( customer.getUpdatedAt() );

        return customerResponse;
    }

    @Override
    public void updateEntity(CustomerRequest request, Customer customer) {
        if ( request == null ) {
            return;
        }

        customer.setFullName( request.getFullName() );
        customer.setPhone( request.getPhone() );
        customer.setEmail( request.getEmail() );
        customer.setPasswordHash( request.getPasswordHash() );
        customer.setTier( request.getTier() );
        customer.setAccumulatedPoints( request.getAccumulatedPoints() );
        customer.setTotalSpent( request.getTotalSpent() );
        customer.setTotalWashes( request.getTotalWashes() );

        customer.setUpdatedAt( LocalDateTime.now() );
    }
}
