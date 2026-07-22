package com.autowashpro.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Set;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider,
                                   RestAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String token = authorizationHeader.substring(7);
            try {
                if (token.isBlank()) {
                    throw new org.springframework.security.authentication.BadCredentialsException(
                            "Invalid bearer token.");
                }
                var claims = jwtTokenProvider.parseToken(token);
                String customerId = claims.getSubject();
                String role = claims.get("role", String.class);
                if (claims.getExpiration() == null
                        || !claims.getExpiration().after(new Date())
                        || customerId == null
                        || !customerId.matches("[1-9][0-9]*")
                        || !Set.of("CUSTOMER", "STAFF", "ADMIN").contains(role)) {
                    throw new org.springframework.security.authentication.BadCredentialsException(
                            "Invalid bearer token.");
                }

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        customerId,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception ex) {
                SecurityContextHolder.clearContext();
                authenticationEntryPoint.commence(request, response,
                        new org.springframework.security.authentication.BadCredentialsException("Invalid bearer token."));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
