package com.autowashpro.repository;

import com.autowashpro.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByStatusIgnoreCase(String status);
    List<Service> findByServiceCodeIn(List<String> serviceCodes);
}
