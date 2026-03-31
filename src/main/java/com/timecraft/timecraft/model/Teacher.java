package com.timecraft.timecraft.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Maps to the same 'users' table as User.java.
 * Use this entity for teacher-specific business logic.
 * Use User.java for authentication / Spring Security contexts.
 *
 * Teachers can teach ANY subject at ANY year level.
 * The only hard constraint is no two classes at the same timeslot.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Always "TEACHER" — matches the users.user_type CHECK constraint. */
    @Column(name = "user_type", nullable = false, length = 10)
    @Builder.Default
    private String userType = "TEACHER";

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    /** Institutional ID e.g. T-2020-001 — unique system-wide. */
    @Column(name = "school_id", nullable = false, unique = true, length = 30)
    private String schoolId;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    /** BCrypt-hashed password. Never expose plaintext. */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Relationships ─────────────────────────────────────────────────────────

    /**
     * All schedule entries assigned to this teacher — spans all year levels.
     * A teacher can have Year 1 subjects in the morning and Year 4 in the
     * afternoon.
     * The only restriction enforced is no duplicate timeslot within the same term.
     */
    @OneToMany(mappedBy = "teacher", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Schedule> schedules = new ArrayList<>();

}