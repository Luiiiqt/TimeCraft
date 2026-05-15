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
@Table(name = "teacher_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
     * No year-level restriction — teachers can teach any year level.
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
    @Column(name = "is_ge_teacher", nullable = false)
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
     * TRUE = this teacher can be assigned subjects outside their home department.
     * Used when a teacher from one course/department also teaches in another.
     */
    @Column(name = "is_cross_department", nullable = false)
    @Builder.Default
    private boolean isCrossDepartment = false;

    /**
     * Returns true if this teacher is a GE teacher who can be
     * scheduled at either campus.
     */
    public boolean isGETeacher() {
        return campusFlexible ||
               (department != null && "GEN_ED".equals(department.getCode()));
    }
}