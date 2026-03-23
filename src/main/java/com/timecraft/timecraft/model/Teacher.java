package com.timecraft.timecraft.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    /**
     * Always "TEACHER" for this entity.
     * Stored as a plain string column — matches the users.user_type
     * CHECK constraint in the DB.
     */
    @Column(name = "user_type", nullable = false, length = 10)
    @Builder.Default
    private String userType = "TEACHER";

    /** Legal full name e.g. "Dr. Maria Santos". */
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    /**
     * Institutional ID — unique system-wide.
     * Convention: "T-YYYY-NNN" e.g. "T-2020-001".
     */
    @Column(name = "school_id", nullable = false, unique = true, length = 30)
    private String schoolId;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    /** BCrypt-hashed password. Never store or expose plaintext. */
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
     * Department this teacher belongs to.
     * Can be General Education or any college department
     * e.g. College of Nursing, College of Computer Studies and Engineering.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false,
                table = "teacher_profiles")
    private Department department;

    /**
     * All timeslots this teacher has declared as available.
     * The scheduling engine only uses entries where available = TRUE.
     */
    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TeacherAvailability> availabilities = new ArrayList<>();

    /**
     * All schedule entries where this teacher is assigned.
     * Use this to compute teaching load and detect double-booking.
     */
    @OneToMany(mappedBy = "teacher", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Schedule> schedules = new ArrayList<>();
}