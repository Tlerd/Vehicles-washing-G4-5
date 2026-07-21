package com.autowashpro.repository;

import com.autowashpro.entity.PhoneVerificationProof;
import com.autowashpro.entity.VerificationPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface PhoneVerificationProofRepository extends JpaRepository<PhoneVerificationProof, String> {

    // clearAutomatically = true is mandatory, not stylistic: a @Modifying bulk UPDATE runs as raw
    // SQL bypassing the persistence context, so without clearing it, a findById() later in the same
    // transaction returns the stale already-managed entity (still showing consumedAt == null) instead
    // of re-reading the DB. This repository test class relies on exactly that read-after-write pattern.
    //
    // @Transactional is mandatory here too, not inherited "for free": Spring Data's default-transaction
    // wrapping reliably covers SimpleJpaRepository's own CRUD methods (save/findById/etc), but a custom
    // @Modifying @Query method has no transaction of its own unless one is supplied — either by the
    // caller (e.g. @DataJpaTest wraps every test method in one, which is why Task 3's repository tests
    // passed) or, absent that, by annotating the method itself. Without this, a caller with no active
    // transaction (proven by this repository's own concurrency test, which calls consumeIfValid directly
    // from worker threads under a plain @SpringBootTest with no surrounding transaction) hits
    // jakarta.persistence.TransactionRequiredException before ever reaching the database.
    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE PhoneVerificationProof p SET p.consumedAt = :now " +
           "WHERE p.proofToken = :token AND p.phone = :phone AND p.purpose = :purpose " +
           "AND p.consumedAt IS NULL AND p.expiresAt > :now")
    int consumeIfValid(@Param("token") String token, @Param("phone") String phone,
                        @Param("purpose") VerificationPurpose purpose, @Param("now") LocalDateTime now);

    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("UPDATE PhoneVerificationProof p SET p.consumedAt = :now " +
           "WHERE p.proofToken = :token AND p.purpose = :purpose " +
           "AND p.consumedAt IS NULL AND p.expiresAt > :now")
    int consumeIfValidForPurpose(@Param("token") String token, @Param("purpose") VerificationPurpose purpose,
                                  @Param("now") LocalDateTime now);
}
