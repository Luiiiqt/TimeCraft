package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.model.TeacherSubjectPreference.Status;

@Repository
public interface TeacherSubjectPreferenceRepository
        extends JpaRepository<TeacherSubjectPreference, Long> {

    List<TeacherSubjectPreference> findByTeacherId(Long teacherId);
    List<TeacherSubjectPreference> findByTeacherIdAndSemesterAndSchoolYear(
            Long teacherId, String semester, String schoolYear);
    List<TeacherSubjectPreference> findBySubjectIdInAndSemesterAndSchoolYear(
            List<Long> subjectIds, String semester, String schoolYear);
    List<TeacherSubjectPreference> findByStatus(Status status);
    Optional<TeacherSubjectPreference> findByTeacherIdAndSubjectIdAndSemesterAndSchoolYear(
            Long teacherId, Long subjectId, String semester, String schoolYear);

    List<TeacherSubjectPreference> findByTeacherIdAndSubjectIdAndCourseIdAndSemesterAndSchoolYear(
            Long teacherId, Long subjectId, Long courseId, String semester, String schoolYear);

    List<TeacherSubjectPreference> findByCourseIdAndSemesterAndSchoolYear(
            Long courseId, String semester, String schoolYear);

    /** All pending preferences scoped to subjects a PH manages. */
    List<TeacherSubjectPreference> findBySubjectIdInAndStatusAndSemesterAndSchoolYear(
            List<Long> subjectIds, TeacherSubjectPreference.Status status,
            String semester, String schoolYear);
}