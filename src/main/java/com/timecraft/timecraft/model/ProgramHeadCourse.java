package com.timecraft.timecraft.model;

import java.io.Serializable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "program_head_courses")
@IdClass(ProgramHeadCourse.ProgramHeadCourseId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgramHeadCourse {

    @Id
    @Column(name = "ph_user_id")
    private Long phUserId;

    @Id
    @Column(name = "course_id")
    private Long courseId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ph_user_id", insertable = false, updatable = false)
    private User programHead;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    private Course course;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgramHeadCourseId implements Serializable {
        private Long phUserId;
        private Long courseId;
    }
}