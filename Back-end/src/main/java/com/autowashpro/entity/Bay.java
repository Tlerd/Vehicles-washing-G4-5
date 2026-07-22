package com.autowashpro.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bays")
public class Bay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bay_id")
    private Long bayId;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "bay_code", nullable = false, length = 20)
    private String bayCode;

    @Column(name = "bay_type", nullable = false, length = 20)
    private String bayType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
