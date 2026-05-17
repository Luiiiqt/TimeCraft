package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.model.TeacherSubjectPreference.Status;

@Repository
public interface TeacherSubjectPreferenceRepository
        extends JpaRepository<TeacherSubjectPreference, Long> {

    List<TeacherSubjectPreference> findByTeacherId(Long teacherId);

    List<TeacherSubjectPreference> findByTeacherIdAndSemesterAndSchoolYear(
            Long teacherId, Semester semester, String schoolYear);

    void deleteByTeacherIdAndSchoolYear(Long teacherId, String schoolYear);

    List<TeacherSubjectPreference> findBySubjectIdInAndSemesterAndSchoolYear(
            List<Long> subjectIds, Semester semester, String schoolYear);

    List<TeacherSubjectPreference> findByStatus(Status status);

    Optional<TeacherSubjectPreference> findByTeacherIdAndSubjectIdAndSemesterAndSchoolYear(
            Long teacherId, Long subjectId, Semester semester, String schoolYear);

    List<TeacherSubjectPreference> findByTeacherIdAndSubjectIdAndCourseIdAndSemesterAndSchoolYear(
            Long teacherId, Long subjectId, Long courseId, Semester semester, String schoolYear);

    List<TeacherSubjectPreference> findByCourseIdAndSemesterAndSchoolYear(
            Long courseId, Semester semester, String schoolYear);

    List<TeacherSubjectPreference> findBySubjectIdInAndStatusAndSemesterAndSchoolYear(
            List<Long> subjectIds, Status status, Semester semester, String schoolYear);

        List<TeacherSubjectPreference> findBySubjectIdIn(List<Long> subjectIds);
}