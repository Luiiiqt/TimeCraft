package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.StudentProfile;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

        Optional<StudentProfile> findByUserId(Long userId);

        boolean existsByUserId(Long userId);

        List<StudentProfile> findByCourseId(Long courseId);

        List<StudentProfile> findByDepartmentId(Long departmentId);

        List<StudentProfile> findByCourseIdAndYearLevel(Long courseId, Short yearLevel);

        List<StudentProfile> findByCourseIdAndYearLevelAndSection(Long courseId,
                        Short yearLevel,
                        String section);

        // ── Irregular students ────────────────────────────────────────────────────

        List<StudentProfile> findByIsIrregularTrue();

        List<StudentProfile> findByCourseIdAndIsIrregularTrue(Long courseId);

        List<StudentProfile> findByCourseIdAndYearLevelAndIsIrregularTrue(
                        Long courseId, Short yearLevel);

        // ── Section helpers ───────────────────────────────────────────────────────

        @Query("SELECT DISTINCT sp.section FROM StudentProfile sp " +
                        "WHERE sp.course.id = :courseId AND sp.yearLevel = :yearLevel " +
                        "AND sp.section IS NOT NULL")
        List<String> findDistinctSectionsByCourseAndYear(
                        @Param("courseId") Long courseId,
                        @Param("yearLevel") Short yearLevel);

        long countByCourseIdAndYearLevelAndSection(Long courseId,
                        Short yearLevel,
                        String section);

        List<StudentProfile> findByApplicationStatus(
                        com.timecraft.timecraft.model.StudentProfile.ApplicationStatus applicationStatus);

        List<StudentProfile> findByIsIrregularTrueAndApplicationStatus(
                        com.timecraft.timecraft.model.StudentProfile.ApplicationStatus applicationStatus);

        List<StudentProfile> findByApplicationStatusIn(
                        List<com.timecraft.timecraft.model.StudentProfile.ApplicationStatus> statuses);
}
