package com.autowashpro.repository;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BranchRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class BayRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private BayRepository bayRepository;

    @Test
    void findByBranchBranchIdAndBayType_returnsOnlyMatchingBays() {
        Branch branch = branchRepository.saveAndFlush(BookingTestFixtures.newBranch("Bay Test Branch"));

        Bay quickBay = new Bay();
        quickBay.setBranch(branch);
        quickBay.setBayCode("Q1");
        quickBay.setBayType("QUICK");
        quickBay.setCreatedAt(LocalDateTime.now());
        bayRepository.saveAndFlush(quickBay);

        Bay detailBay = new Bay();
        detailBay.setBranch(branch);
        detailBay.setBayCode("D1");
        detailBay.setBayType("DETAIL");
        detailBay.setCreatedAt(LocalDateTime.now());
        bayRepository.saveAndFlush(detailBay);

        List<Bay> quickBays = bayRepository.findByBranchBranchIdAndBayType(branch.getBranchId(), "QUICK");

        assertThat(quickBays).hasSize(1);
        assertThat(quickBays.get(0).getBayCode()).isEqualTo("Q1");
        assertThat(bayRepository.findByBranchBranchId(branch.getBranchId())).hasSize(2);
    }

    @Test
    void insertDefaultIfMissing_isIdempotentAtTheDatabaseBoundary() {
        Branch branch = branchRepository.saveAndFlush(
                BookingTestFixtures.newBranch("Atomic Bay Seed"));

        bayRepository.insertDefaultIfMissing(branch.getBranchId(), "Q1", "QUICK");
        bayRepository.insertDefaultIfMissing(branch.getBranchId(), "Q1", "QUICK");

        assertThat(bayRepository.findByBranchBranchId(branch.getBranchId()))
                .extracting(Bay::getBayCode)
                .containsExactly("Q1");
    }
}
