package com.autowashpro.config;

import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BranchRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

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
            seedBayIfMissing(branch, "Q1", "QUICK");
            seedBayIfMissing(branch, "Q2", "QUICK");
            seedBayIfMissing(branch, "D1", "DETAIL");
            seedBayIfMissing(branch, "U1", "UNIVERSAL");
        }
    }

    private void seedBayIfMissing(Branch branch, String code, String type) {
        bays.insertDefaultIfMissing(branch.getBranchId(), code, type);
    }
}
