    package com.timecraft.timecraft.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.DeanCourse;

@Repository
public interface DeanCourseRepository
        extends JpaRepository<DeanCourse, DeanCourse.DeanCourseId> {

    List<DeanCourse> findByDeanUserId(Long deanUserId);
    List<DeanCourse> findByCourseId(Long courseId);
}