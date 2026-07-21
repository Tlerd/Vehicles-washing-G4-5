package com.autowashpro.config;

import com.autowashpro.entity.Bay;
import com.autowashpro.entity.Branch;
import com.autowashpro.repository.BayRepository;
import com.autowashpro.repository.BranchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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
        when(bayRepository.findByBranchBranchId(1L)).thenReturn(List.of());

        baySeeder.run();

        ArgumentCaptor<Bay> captor = ArgumentCaptor.forClass(Bay.class);
        verify(bayRepository, times(4)).save(captor.capture());
        List<String> types = captor.getAllValues().stream().map(Bay::getBayType).toList();
        assertThat(types).containsExactly("QUICK", "QUICK", "DETAIL", "UNIVERSAL");
    }

    @Test
    void run_branchAlreadySeeded_skipsSeeding() throws Exception {
        Branch branch = new Branch();
        branch.setBranchId(1L);
        when(branchRepository.findAll()).thenReturn(List.of(branch));
        when(bayRepository.findByBranchBranchId(1L)).thenReturn(List.of(new Bay()));

        baySeeder.run();

        verify(bayRepository, never()).save(any());
    }
}
