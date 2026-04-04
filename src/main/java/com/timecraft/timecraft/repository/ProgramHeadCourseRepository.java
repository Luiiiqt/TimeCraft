    package com.timecraft.timecraft.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.ProgramHeadCourse;

@Repository
public interface ProgramHeadCourseRepository
        extends JpaRepository<ProgramHeadCourse, ProgramHeadCourse.ProgramHeadCourseId> {

    List<ProgramHeadCourse> findByPhUserId(Long phUserId);
    List<ProgramHeadCourse> findByCourseId(Long courseId);
}