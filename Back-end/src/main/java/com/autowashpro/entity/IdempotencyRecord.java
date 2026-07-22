package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "idempotency_records")
public class IdempotencyRecord {

    @Id
    @Column(name = "idempotency_key", length = 64)
    private String scopedKeyHash;

    @Column(name = "request_path", nullable = false, length = 200)
    private String requestPath;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "guest_phone", length = 20)
    private String guestPhone;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Column(name = "principal_scope_hash", nullable = false, length = 64)
    private String principalScopeHash;

    @Column(name = "client_key_hash", nullable = false, length = 64)
    private String clientKeyHash;

    @Column(name = "guest_proof_hash", length = 64)
    private String guestProofHash;

    @Column(name = "hash_version", nullable = false)
    private Integer hashVersion = 2;

    @Column(name = "response_status", nullable = false)
    private Integer responseStatus;

    @Column(name = "response_body", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String responseBody;

    @Column(name = "response_location", length = 200)
    private String responseLocation;

    @Column(name = "response_cache_control", length = 100)
    private String responseCacheControl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
