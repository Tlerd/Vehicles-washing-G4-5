package com.autowashpro.config;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BranchRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class BaySeeder implements CommandLineRunner {

    private final BranchRepository branches;
    private final BayRepository bays;

    public BaySeeder(BranchRepository branches, BayRepository bays) {
        this.branches = branches;
        this.bays = bays;
    }

    @Override
    public void run(String... args) {
        for (Branch branch : branches.findAll()) {
            if (!bays.findByBranchBranchId(branch.getBranchId()).isEmpty()) {
                continue;
            }
            seedBay(branch, "Q1", "QUICK");
            seedBay(branch, "Q2", "QUICK");
            seedBay(branch, "D1", "DETAIL");
            seedBay(branch, "U1", "UNIVERSAL");
        }
    }

    private void seedBay(Branch branch, String code, String type) {
        Bay bay = new Bay();
        bay.setBranch(branch);
        bay.setBayCode(code);
        bay.setBayType(type);
        bay.setCreatedAt(LocalDateTime.now());
        bays.save(bay);
    }
}
