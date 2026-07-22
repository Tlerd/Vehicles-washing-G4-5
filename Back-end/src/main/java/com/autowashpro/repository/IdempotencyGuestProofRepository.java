package com.autowashpro.repository;

import com.autowashpro.entity.IdempotencyGuestProof;
import com.autowashpro.entity.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface IdempotencyGuestProofRepository
        extends JpaRepository<IdempotencyGuestProof, String> {

    @Query("SELECT p.record FROM IdempotencyGuestProof p " +
            "WHERE p.proofHash = :proofHash " +
            "AND p.record.clientKeyHash = :clientKeyHash " +
            "AND p.record.requestPath = :requestPath")
    Optional<IdempotencyRecord> findReplayRecord(
            @Param("proofHash") String proofHash,
            @Param("clientKeyHash") String clientKeyHash,
            @Param("requestPath") String requestPath);
}
