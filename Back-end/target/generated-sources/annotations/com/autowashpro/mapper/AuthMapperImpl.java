package com.autowashpro.mapper;

import com.autowashpro.dto.request.RegisterRequest;
import com.autowashpro.dto.response.LoginCustomerResponse;
import com.autowashpro.dto.response.RegisterResponse;
import com.autowashpro.entity.Customer;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-27T10:32:13+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.12 (Oracle Corporation)"
)
@Component
public class AuthMapperImpl implements AuthMapper {

    @Override
    public Customer toCustomer(RegisterRequest request) {
        if ( request == null ) {
            return null;
        }

        Customer customer = new Customer();

        customer.setFullName( request.getName() );
        customer.setEmail( request.getEmail() );

        customer.setTier( "Member" );
        customer.setAccumulatedPoints( 0 );
        customer.setTotalSpent( BigDecimal.ZERO );
        customer.setTotalWashes( 0 );
        customer.setCreatedAt( LocalDateTime.now() );
        customer.setUpdatedAt( LocalDateTime.now() );

        return customer;
    }

    @Override
    public RegisterResponse toRegisterResponse(Customer customer) {
        if ( customer == null ) {
            return null;
        }

        boolean success = true;
        String customerId = String.valueOf(customer.getCustomerId());

        RegisterResponse registerResponse = new RegisterResponse( success, customerId );

        return registerResponse;
    }

    @Override
    public LoginCustomerResponse toLoginCustomerResponse(Customer customer) {
        if ( customer == null ) {
            return null;
        }

        LoginCustomerResponse loginCustomerResponse = new LoginCustomerResponse();

        loginCustomerResponse.setName( customer.getFullName() );
        loginCustomerResponse.setPhone( customer.getPhone() );
        loginCustomerResponse.setTier( customer.getTier() );
        loginCustomerResponse.setAccumulatedPoints( customer.getAccumulatedPoints() );

        loginCustomerResponse.setId( String.valueOf(customer.getCustomerId()) );
        loginCustomerResponse.setTotalSpend( customer.getTotalSpent().longValue() );

        return loginCustomerResponse;
    }
}
