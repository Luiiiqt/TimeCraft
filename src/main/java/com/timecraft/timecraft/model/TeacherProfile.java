package com.timecraft.timecraft.model;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "teacher_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeacherProfile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * Department this teacher belongs to.
     * GEN_ED = campus-flexible (can teach at CLI or CHS).
     * All other departments = locked to their college's campus.
     *
     * Note: year level is NOT a restriction — all teachers can teach
     * any year level within their department's subjects.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    /**
     * TRUE  = General Education teacher.
     *         Can be scheduled at CLI or CHS — no campus restriction.
     * FALSE = Department-specific teacher.
     *         Locked to the campus that serves their college.
     */
    @Column(name = "campus_flexible", nullable = false)
    @Builder.Default
    private boolean campusFlexible = false;

    /**
     * Home campus for GE (flexible) teachers.
     * Scheduler prefers this campus but assigns to the other when needed.
     * NULL for non-flexible teachers — campus derived from department.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "preferred_campus_id")
    private Campus preferredCampus;

    /**
     * Timeslots declared available by this teacher.
     * Applies across all year levels and both campuses for flexible teachers.
     */
    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<TeacherAvailability> availabilities = new HashSet<>();

    /**
     * Returns true if this teacher is a GE teacher who can be
     * scheduled at either campus.
     */
    public boolean isGETeacher() {
        return campusFlexible;
    }
}