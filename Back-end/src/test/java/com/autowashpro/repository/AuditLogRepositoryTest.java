package com.autowashpro.repository;

import com.autowashpro.entity.AuditLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AuditLogRepositoryTest extends RepositoryIntegrationTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    void findByEntityTypeAndEntityId_ordersNewestFirst() {
        AuditLog older = new AuditLog();
        older.setEntityType("BOOKING");
        older.setEntityId("42");
        older.setAction("STATUS_CHANGED");
        older.setActorId("1");
        older.setActorRole("STAFF");
        older.setCreatedAt(LocalDateTime.now().minusMinutes(10));
        auditLogRepository.saveAndFlush(older);

        AuditLog newer = new AuditLog();
        newer.setEntityType("BOOKING");
        newer.setEntityId("42");
        newer.setAction("STATUS_CHANGED");
        newer.setActorId("1");
        newer.setActorRole("STAFF");
        newer.setCreatedAt(LocalDateTime.now());
        auditLogRepository.saveAndFlush(newer);

        List<AuditLog> logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("BOOKING", "42");

        assertThat(logs).hasSize(2);
        assertThat(logs.get(0).getId()).isEqualTo(newer.getId());
        assertThat(logs.get(1).getId()).isEqualTo(older.getId());
    }
}
