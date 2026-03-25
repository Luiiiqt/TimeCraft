package com.timecraft.timecraft.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.CourseSubject.Semester;

@Repository
public interface CourseSubjectRepository extends JpaRepository<CourseSubject, Long> {

    List<CourseSubject> findByCourseId(Long courseId);

    List<CourseSubject> findByCourseIdAndYearLevel(Long courseId, short yearLevel);

    List<CourseSubject> findByCourseIdAndYearLevelAndSemester(Long courseId,
                                                               short yearLevel,
                                                               Semester semester);

    List<CourseSubject> findByIsSharedTrue();

    List<CourseSubject> findBySubjectIdAndIsSharedTrue(Long subjectId);

    boolean existsByCourseIdAndSubjectId(Long courseId, Long subjectId);

    @Query("SELECT cs FROM CourseSubject cs WHERE cs.subject.id = :subjectId")
    List<CourseSubject> findCoursesBySubjectId(@Param("subjectId") Long subjectId);

    @Query("SELECT cs FROM CourseSubject cs " +
           "JOIN FETCH cs.subject s " +
           "WHERE cs.course.id = :courseId " +
           "ORDER BY cs.yearLevel, cs.semester")
    List<CourseSubject> findFullCurriculumByCourseId(
            @Param("courseId") Long courseId);
}