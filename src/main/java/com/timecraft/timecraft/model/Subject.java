package com.timecraft.timecraft.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    /** MAJOR or MINOR classification. */
    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 10)
    private SubjectType subjectType;

    /**
     * Whether this subject requires a lecture room or a laboratory room.
     * The scheduling engine matches this against Room.roomType.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 15)
    private SessionType sessionType;

    /**
     * Always 90 minutes (1 hour 30 minutes) per session.
     * Enforced by DB CHECK constraint.
     */
    @Column(name = "duration_mins", nullable = false)
    @Builder.Default
    private short durationMins = 90;

    /**
     * Number of times this subject meets per week.
     * Typically 2 for both major and minor subjects.
     */
    @Column(name = "sessions_per_week", nullable = false)
    @Builder.Default
    private short sessionsPerWeek = 2;

    /** Credit units. */
    @Column(name = "units", nullable = false)
    @Builder.Default
    private short units = 3;

    /** Department that owns this subject. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Relationships ─────────────────────────────────────────────────────────
    /** Curriculum mappings — which courses include this subject. */
    @OneToMany(mappedBy = "subject", fetch = FetchType.LAZY)
    @Builder.Default
    private List<CourseSubject> courseSubjects = new ArrayList<>();

    // ── Enums ─────────────────────────────────────────────────────────────────
    public enum SubjectType {
        MAJOR, MINOR
    }

    public enum SessionType {
        LECTURE, LABORATORY
    }
}