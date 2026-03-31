package com.timecraft.timecraft.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.StudentChecklist;

@Repository
public interface StudentChecklistRepository extends JpaRepository<StudentChecklist, Long> {

    /** All checklist entries for a specific student. */
    List<StudentChecklist> findByStudentId(Long studentId);

    /** All checklist entries for a given semester and academic year. */
    List<StudentChecklist> findBySemesterAndAcademicYear(
            String semester, String academicYear);

    /** Check if a student already enrolled in a specific subject this term. */
    boolean existsByStudentIdAndSubjectIdAndSemesterAndAcademicYear(
            Long studentId, Long subjectId, String semester, String academicYear);

    /** Delete all entries for a student in a given term (re-enrollment). */
    void deleteByStudentIdAndSemesterAndAcademicYear(
            Long studentId, String semester, String academicYear);

    /**
     * Aggregate demand per subject for a given term.
     * Used by the scheduling engine to decide how many sections to open.
     * Returns [Subject, studentCount].
     */
    @Query("SELECT sc.subject, COUNT(sc) AS demand " +
            "FROM StudentChecklist sc " +
            "WHERE sc.semester = :semester AND sc.academicYear = :academicYear " +
            "GROUP BY sc.subject " +
            "ORDER BY demand DESC")
    List<Object[]> findSubjectDemandBySemester(
            @Param("semester") String semester,
            @Param("academicYear") String academicYear);
}