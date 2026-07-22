package com.autowashpro.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "idempotency_guest_proofs")
public class IdempotencyGuestProof {

    @Id
    @Column(name = "proof_hash", length = 64)
    private String proofHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idempotency_key", nullable = false)
    private IdempotencyRecord record;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
