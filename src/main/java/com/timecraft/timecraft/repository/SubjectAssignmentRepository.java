package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.SubjectAssignment;

@Repository
public interface SubjectAssignmentRepository
                extends JpaRepository<SubjectAssignment, Long> {

        List<SubjectAssignment> findByAssignedByIdAndSemesterAndSchoolYear(
                        Long deanId, String semester, String schoolYear);

        List<SubjectAssignment> findBySemesterAndSchoolYearAndIsFinalizedTrue(
                        String semester, String schoolYear);

        Optional<SubjectAssignment> findBySubjectIdAndSectionIdAndSemesterAndSchoolYear(
                        Long subjectId, Long sectionId, String semester, String schoolYear);

        Optional<SubjectAssignment> findBySubjectIdAndSectionIdAndSemesterAndSchoolYearAndIsFinalizedTrue(
                        Long subjectId, Long sectionId, String semester, String schoolYear);

        List<SubjectAssignment> findBySubjectId(Long subjectId);

        // Fetch all assignments for a set of subject IDs in a given term
        List<SubjectAssignment> findBySubjectIdInAndSemesterAndSchoolYear(
                        List<Long> subjectIds, String semester, String schoolYear);

        boolean existsByTeacherIdAndSubjectIdAndSemesterAndSchoolYear(
                        Long teacherId, Long subjectId, String semester, String schoolYear);

        Optional<SubjectAssignment> findBySubjectIdAndSemesterAndSchoolYear(
        Long subjectId, String semester, String schoolYear);
}