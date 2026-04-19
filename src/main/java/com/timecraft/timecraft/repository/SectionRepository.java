package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Section;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {

        Optional<Section> findByCourseIdAndYearLevelAndSectionNameAndSemesterAndSchoolYear(
                        Long courseId, short yearLevel, String sectionName,
                        Semester semester, String schoolYear);

        boolean existsByCourseIdAndYearLevelAndSectionNameAndSemesterAndSchoolYear(
                        Long courseId, short yearLevel, String sectionName,
                        Semester semester, String schoolYear);

        List<Section> findByCourseId(Long courseId);

        List<Section> findByCourseIdAndYearLevel(Long courseId, short yearLevel);

        List<Section> findByCourseIdAndSemesterAndSchoolYear(Long courseId,
                        Semester semester,
                        String schoolYear);

        List<Section> findByCourseIdAndYearLevelAndSemesterAndSchoolYear(
                        Long courseId, short yearLevel,
                        com.timecraft.timecraft.model.CourseSubject.Semester semester,
                        String schoolYear);

        List<Section> findBySemesterAndSchoolYear(Semester semester, String schoolYear);

        List<Section> findByCourseIdAndYearLevelAndSectionName(
                        Long courseId, Short yearLevel, String sectionName);

        List<Section> findByIsActiveTrue();

        /**
         * Counts how many REGULAR students are currently enrolled in a section.
         */
        @Query("SELECT COUNT(DISTINCT ss.student.id) FROM StudentSchedule ss " +
                        "JOIN ss.schedule sc " +
                        "WHERE sc.section.id = :sectionId " +
                        "AND ss.assignmentType = 'REGULAR'")
        long countRegularStudentsBySection(@Param("sectionId") Long sectionId);

}