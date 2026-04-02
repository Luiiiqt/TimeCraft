package com.timecraft.timecraft.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Full subject name e.g. "Data Structures and Algorithms". */
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /** Subject code e.g. "IT-DSA", "GE-US". */
    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 10)
    private SubjectType subjectType;

    /**
     * Determines required room type during scheduling.
     * LECTURE → must use a LECTURE room.
     * LABORATORY → must use a LABORATORY room.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 15)
    private SessionType sessionType;

    /** Always 90 minutes. Enforced by DB CHECK constraint. */
    @Column(name = "duration_mins", nullable = false)
    @Builder.Default
    private short durationMins = 90;

    /** Meets twice per week. */
    @Column(name = "sessions_per_week", nullable = false)
    @Builder.Default
    private short sessionsPerWeek = 2;

    @Column(name = "units", nullable = false)
    @Builder.Default
    private short units = 3;

    /**
     * Self-referencing FK to the prerequisite subject.
     * NULL = no prerequisite.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prerequisite_subject_id")
    private Subject prerequisite;

    /** Owning department. No year-level restriction on teacher assignment. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "subject", fetch = FetchType.LAZY)
    @Builder.Default
    private List<CourseSubject> courseSubjects = new ArrayList<>();

    public enum SubjectType {
        MAJOR, MINOR
    }

    public enum SessionType {
        LECTURE, LABORATORY
    }
}