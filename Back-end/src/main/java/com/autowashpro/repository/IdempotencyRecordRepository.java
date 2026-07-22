package com.autowashpro.repository;

import com.autowashpro.entity.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, String> {

    @Query(value = "SELECT * FROM dbo.idempotency_records WITH (UPDLOCK, HOLDLOCK) " +
            "WHERE idempotency_key = CAST(:scopedKeyHash AS VARCHAR(64))", nativeQuery = true)
    Optional<IdempotencyRecord> lockByScopedKeyHash(
            @Param("scopedKeyHash") String scopedKeyHash);

    Optional<IdempotencyRecord> findByRequestPathAndPrincipalScopeHashAndClientKeyHash(
            String requestPath, String principalScopeHash, String clientKeyHash);

    Optional<IdempotencyRecord> findByGuestProofHashAndClientKeyHashAndRequestPath(
            String guestProofHash, String clientKeyHash, String requestPath);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE TOP (:batchSize) FROM dbo.idempotency_records " +
            "WHERE expires_at <= :cutoff", nativeQuery = true)
    int deleteExpiredBatch(
            @Param("cutoff") LocalDateTime cutoff,
            @Param("batchSize") int batchSize);
}
