package com.timecraft.timecraft.model;

import java.util.ArrayList;
import java.util.List;

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
import jakarta.persistence.Transient;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sections", uniqueConstraints = @UniqueConstraint(name = "uq_section_course_year_name_term", columnNames = {
        "course_id", "year_level", "section_name", "semester", "school_year" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Section {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /** Year level this section belongs to (1–5). */
    @Column(name = "year_level", nullable = false)
    private short yearLevel;

    /** Section identifier e.g. "A", "B", "C". */
    @Column(name = "section_name", nullable = false, length = 10)
    private String sectionName;

    @Enumerated(EnumType.STRING)
    @Column(name = "semester", nullable = false, length = 20)
    private CourseSubject.Semester semester;

    /** Academic year e.g. "2024-2025". */
    @Column(name = "school_year", nullable = false, length = 10)
    private String schoolYear;

    @Column(name = "max_students", nullable = false)
    @Builder.Default
    private short maxStudents = 45;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @OneToMany(mappedBy = "section", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Schedule> schedules = new ArrayList<>();

    /** Convenience label e.g. "BSIT 1-A 1st Sem 2024-2025". */
    @Transient
    public String getDisplayLabel() {
        return String.format("%s %d-%s %s %s",
                course.getCode(), yearLevel, sectionName,
                semester.getLabel(), schoolYear);
    }
}