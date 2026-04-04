package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.timecraft.timecraft.model.SectionConfig;

public interface SectionConfigRepository extends JpaRepository<SectionConfig, Long> {

    Optional<SectionConfig> findByCourseIdAndYearLevelAndSemesterAndSchoolYear(
            Long courseId, short yearLevel, String semester, String schoolYear);

    List<SectionConfig> findByCourseIdAndSemesterAndSchoolYear(
            Long courseId, String semester, String schoolYear);
}