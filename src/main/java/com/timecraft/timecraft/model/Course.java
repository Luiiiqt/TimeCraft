package com.timecraft.timecraft.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    /** Full program name e.g. "Bachelor of Science in Information Technology". */
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    /** Short code e.g. "BSIT", "BSCS", "BSN", "MIS". */
    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "degree_level", nullable = false, length = 10)
    private DegreeLevel degreeLevel;

    /** Total number of years for the program (typically 4, some 5). */
    @Column(name = "years_duration", nullable = false)
    @Builder.Default
    private Short yearsDuration = 4;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    // ── Relationships ─────────────────────────────────────────────────────────
    @OneToMany(mappedBy = "course", fetch = FetchType.LAZY)
    @Builder.Default
    private List<CourseSubject> courseSubjects = new ArrayList<>();

    @OneToMany(mappedBy = "course", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Section> sections = new ArrayList<>();

    // ── Enum ──────────────────────────────────────────────────────────────────
    public enum DegreeLevel {
        BACHELOR, MASTER, ASSOCIATE
    }
}