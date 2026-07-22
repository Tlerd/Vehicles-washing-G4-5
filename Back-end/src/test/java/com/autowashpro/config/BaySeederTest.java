package com.autowashpro.config;

import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BranchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BaySeederTest {

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private BayRepository bayRepository;

    private BaySeeder baySeeder;

    @BeforeEach
    void setUp() {
        baySeeder = new BaySeeder(branchRepository, bayRepository);
    }

    @Test
    void run_branchWithNoBays_seedsTwoQuickOneDetailOneUniversal() throws Exception {
        Branch branch = new Branch();
        branch.setBranchId(1L);
        when(branchRepository.findAll()).thenReturn(List.of(branch));

        baySeeder.run();

        verify(bayRepository).insertDefaultIfMissing(1L, "Q1", "QUICK");
        verify(bayRepository).insertDefaultIfMissing(1L, "Q2", "QUICK");
        verify(bayRepository).insertDefaultIfMissing(1L, "D1", "DETAIL");
        verify(bayRepository).insertDefaultIfMissing(1L, "U1", "UNIVERSAL");
    }

    @Test
    void run_withoutBranches_performsNoBayWrites() throws Exception {
        when(branchRepository.findAll()).thenReturn(List.of());

        baySeeder.run();

        verify(bayRepository, never()).insertDefaultIfMissing(anyLong(), anyString(), anyString());
    }

    @Test
    void run_twoBranches_delegatesEightAtomicInsertIfMissingOperations() throws Exception {
        Branch first = new Branch();
        first.setBranchId(1L);
        Branch second = new Branch();
        second.setBranchId(2L);
        when(branchRepository.findAll()).thenReturn(List.of(first, second));

        baySeeder.run();

        verify(bayRepository, times(8)).insertDefaultIfMissing(
                anyLong(), anyString(), anyString());
    }
}
