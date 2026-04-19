package com.timecraft.timecraft.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /** Year level 1–5. */
    @Column(name = "year_level", nullable = false)
    private Short yearLevel;

    /**
     * Block section e.g. "A", "B".
     * NULL when student is irregular — enforced by DB CHECK constraint.
     */
    @Column(name = "section", length = 10)
    private String section;

    /**
     * TRUE = no fixed section; subjects assigned individually.
     * FALSE = belongs to a block section.
     */
    @Column(name = "is_irregular", nullable = false)
    @Builder.Default
    private boolean isIrregular = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "application_status", nullable = false, length = 20)
    @Builder.Default
    private ApplicationStatus applicationStatus = ApplicationStatus.APPROVED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private java.time.LocalDateTime reviewedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public enum ApplicationStatus {
        PENDING, FOR_INTERVIEW, APPROVED, REJECTED
    }
}