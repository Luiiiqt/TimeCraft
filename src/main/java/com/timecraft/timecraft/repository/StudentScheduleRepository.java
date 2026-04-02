package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.StudentSchedule;

@Repository
public interface StudentScheduleRepository
        extends JpaRepository<StudentSchedule, Long> {

    List<StudentSchedule> findByStudentId(Long studentId);

    Optional<StudentSchedule> findByStudentIdAndScheduleId(
            Long studentId, Long scheduleId);

    boolean existsByStudentIdAndScheduleId(
            Long studentId, Long scheduleId);

    Optional<StudentSchedule> findTopByStudentIdOrderByIdDesc(Long studentId);

    int countByScheduleId(Long scheduleId);

    // Checks if student already has a class at the given timeslot
    @Query("""
            SELECT ss FROM StudentSchedule ss
            JOIN ss.schedule sc
            WHERE ss.student.id = :studentId
            AND (sc.timeslot.id = :timeslotId OR sc.timeslot2.id = :timeslotId)
            AND sc.semester = :semester
            AND sc.schoolYear = :schoolYear
            """)
    List<StudentSchedule> findStudentTimeslotConflicts(
            @Param("studentId")  Long studentId,
            @Param("timeslotId") Long timeslotId,
            @Param("semester")   com.timecraft.timecraft.model.CourseSubject.Semester semester,
            @Param("schoolYear") String schoolYear);

    // All enrollments for a student in a given term
    @Query("""
            SELECT ss FROM StudentSchedule ss
            JOIN ss.schedule sc
            WHERE ss.student.id = :studentId
            AND sc.semester = :semester
            AND sc.schoolYear = :schoolYear
            """)
    List<StudentSchedule> findByStudentAndTerm(
            @Param("studentId")  Long studentId,
            @Param("semester")   com.timecraft.timecraft.model.CourseSubject.Semester semester,
            @Param("schoolYear") String schoolYear);
}