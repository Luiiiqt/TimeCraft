package com.timecraft.timecraft.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

    /**
     * Shares the same PK as users.id — no surrogate key needed.
     * MapsId pulls the value from the 'user' association.
     */
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

    /**
     * Year level 1–5.
     */
    @Column(name = "year_level", nullable = false)
    private Short yearLevel;

    /**
     * Block section letter e.g. "A", "B".
     * NULL when the student is irregular.
     */
    @Column(name = "section", length = 10)
    private String section;

    /**
     * TRUE  = no fixed section; assigned subjects individually.
     * FALSE = belongs to a block section.
     * DB CHECK constraint enforces: irregular → section IS NULL.
     */
    @Column(name = "is_irregular", nullable = false)
    @Builder.Default
    private boolean isIrregular = false;
}