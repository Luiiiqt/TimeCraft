package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.Subject.SessionType;
import com.timecraft.timecraft.model.Subject.SubjectType;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

       Optional<Subject> findByCode(String code);

       boolean existsByCode(String code);

       List<Subject> findByDepartmentId(Long departmentId);

       List<Subject> findBySubjectType(SubjectType subjectType);

       List<Subject> findBySessionType(SessionType sessionType);

       List<Subject> findByDepartmentIdAndSubjectType(Long departmentId,
                     SubjectType subjectType);

       List<Subject> findByIsActiveTrue();

       List<Subject> findByDepartmentIdAndIsActiveTrue(Long departmentId);

       /**
        * Returns active subjects for a course at a specific year and semester.
        * No teacher year-level restriction — subjects are matched by curriculum map
        * only.
        */
       @Query("SELECT s FROM Subject s " +
                     "JOIN CourseSubject cs ON cs.subject = s " +
                     "WHERE cs.course.id = :courseId " +
                     "AND cs.yearLevel = :yearLevel " +
                     "AND cs.semester = :semester " +
                     "AND s.isActive = true")
       List<Subject> findByCourseYearAndSemester(@Param("courseId") Long courseId,
                     @Param("yearLevel") short yearLevel,
                     @Param("semester") com.timecraft.timecraft.model.CourseSubject.Semester semester);

       /** Returns subjects shared between multiple courses e.g. BSIT + BSCS. */
       @Query("SELECT s FROM Subject s " +
                     "JOIN CourseSubject cs ON cs.subject = s " +
                     "WHERE cs.isShared = true AND cs.course.id = :courseId")
       List<Subject> findSharedSubjectsByCourse(@Param("courseId") Long courseId);

       @Query("SELECT s FROM Subject s " +
                     "WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                     "OR LOWER(s.code) LIKE LOWER(CONCAT('%', :keyword, '%'))")
       List<Subject> searchByNameOrCode(@Param("keyword") String keyword);
}