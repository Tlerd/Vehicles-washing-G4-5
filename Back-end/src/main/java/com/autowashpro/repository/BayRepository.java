package com.autowashpro.repository;

import com.autowashpro.entity.Bay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface BayRepository extends JpaRepository<Bay, Long> {

    List<Bay> findByBranchBranchId(Long branchId);

    List<Bay> findByBranchBranchIdAndBayType(Long branchId, String bayType);

    @Query("SELECT b FROM Bay b WHERE b.branch.branchId = :branchId AND b.active = true " +
            "ORDER BY b.bayCode ASC, b.bayId ASC")
    List<Bay> findActiveByBranchId(@Param("branchId") Long branchId);

    @Query("SELECT b FROM Bay b WHERE b.branch.branchId = :branchId AND b.active = true " +
            "AND (b.bayType = :requiredType OR b.bayType = 'UNIVERSAL') " +
            "ORDER BY CASE WHEN b.bayType = :requiredType THEN 0 ELSE 1 END, " +
            "b.bayCode ASC, b.bayId ASC")
    List<Bay> findActiveCompatibleForAllocation(
            @Param("branchId") Long branchId,
            @Param("requiredType") String requiredType);

    boolean existsByBranchBranchIdAndBayCode(Long branchId, String bayCode);

    @Modifying
    @Transactional
    @Query(value = """
            SET NOCOUNT ON;
            IF NOT EXISTS (
                SELECT 1 FROM dbo.bays WITH (UPDLOCK, HOLDLOCK)
                WHERE branch_id = :branchId AND bay_code = :bayCode
            )
            BEGIN
                INSERT dbo.bays(branch_id, bay_code, bay_type, is_active, created_at)
                VALUES (:branchId, :bayCode, :bayType, 1, SYSDATETIME());
            END
            """, nativeQuery = true)
    void insertDefaultIfMissing(
            @Param("branchId") Long branchId,
            @Param("bayCode") String bayCode,
            @Param("bayType") String bayType);
}
