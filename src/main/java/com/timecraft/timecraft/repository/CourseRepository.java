package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.Course.DegreeLevel;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    Optional<Course> findByCode(String code);

    boolean existsByCode(String code);

    List<Course> findByDepartmentId(Long departmentId);

    List<Course> findByDepartmentIdAndIsActiveTrue(Long departmentId);

    List<Course> findByIsActiveTrue();

    List<Course> findByDegreeLevel(DegreeLevel degreeLevel);
}