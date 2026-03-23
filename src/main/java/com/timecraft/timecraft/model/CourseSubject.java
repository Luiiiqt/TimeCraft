package com.timecraft.timecraft.model;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "course_subjects",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_course_subject_year_sem",
        columnNames = {"course_id", "subject_id", "year_level", "semester"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /** Year level at which this subject is taken in this course (1–5). */
    @Column(name = "year_level", nullable = false)
    private short yearLevel;

    /** Semester in which this subject is offered. */
    @Enumerated(EnumType.STRING)
    @Column(name = "semester", nullable = false, length = 10)
    private Semester semester;

    /**
     * TRUE  = this subject is shared with at least one other course
     *         (e.g. IT-DSA is shared between BSIT and BSCS).
     * FALSE = exclusive to this course.
     */
    @Column(name = "is_shared", nullable = false)
    @Builder.Default
    private boolean isShared = false;

    // ── Enum ──────────────────────────────────────────────────────────────────
    public enum Semester {
        FIRST("1st"), SECOND("2nd"), SUMMER("Summer");

        private final String label;

        Semester(String label) { this.label = label; }

        public String getLabel() { return label; }
    }
}