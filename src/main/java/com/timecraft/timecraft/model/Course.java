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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
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

    @Column(name = "years_duration", nullable = false)
    @Builder.Default
    private Short yearsDuration = 4;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @OneToMany(mappedBy = "course", fetch = FetchType.LAZY)
    @Builder.Default
    private List<CourseSubject> courseSubjects = new ArrayList<>();

    @OneToMany(mappedBy = "course", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Section> sections = new ArrayList<>();

    public enum DegreeLevel {
        BACHELOR, MASTER, ASSOCIATE
    }
}