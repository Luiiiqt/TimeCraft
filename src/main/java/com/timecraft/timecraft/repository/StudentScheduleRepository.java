package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.StudentSchedule;
import com.timecraft.timecraft.model.StudentSchedule.AssignmentType;

@Repository
public interface StudentScheduleRepository
                extends JpaRepository<StudentSchedule, Long> {

        Optional<StudentSchedule> findByStudentIdAndScheduleId(Long studentId,
                        Long scheduleId);

        boolean existsByStudentIdAndScheduleId(Long studentId, Long scheduleId);

        List<StudentSchedule> findByStudentId(Long studentId);

        List<StudentSchedule> findByStudentIdAndAssignmentType(Long studentId,
                        AssignmentType type);

        @Query("SELECT ss FROM StudentSchedule ss " +
                        "JOIN ss.schedule sc " +
                        "WHERE ss.student.id = :studentId " +
                        "AND sc.semester = :semester AND sc.schoolYear = :schoolYear")
        List<StudentSchedule> findByStudentAndTerm(
                        @Param("studentId") Long studentId,
                        @Param("semester") Semester semester,
                        @Param("schoolYear") String schoolYear);

        /**
         * Checks if an irregular student already has a class at the given timeslot.
         * Prevents double-booking when individually assigning subjects.
         */
        @Query("SELECT ss FROM StudentSchedule ss " +
                        "JOIN ss.schedule sc " +
                        "WHERE ss.student.id = :studentId " +
                        "AND (sc.timeslot.id = :timeslotId OR sc.timeslot2.id = :timeslotId) " +
                        "AND sc.semester = :semester AND sc.schoolYear = :schoolYear")
        List<StudentSchedule> findStudentTimeslotConflicts(
                        @Param("studentId") Long studentId,
                        @Param("timeslotId") Long timeslotId,
                        @Param("semester") Semester semester,
                        @Param("schoolYear") String schoolYear);

        long countByScheduleId(Long scheduleId);

        long countByScheduleIdAndAssignmentType(Long scheduleId,
                        AssignmentType type);

        /** Removes all irregular assignments for a student in a term (for rebuild). */
        @Modifying
        @Transactional
        @Query("DELETE FROM StudentSchedule ss " +
                        "WHERE ss.student.id = :studentId " +
                        "AND ss.assignmentType = 'IRREGULAR' " +
                        "AND ss.schedule.semester = :semester " +
                        "AND ss.schedule.schoolYear = :schoolYear")
        void deleteIrregularAssignmentsByStudentAndTerm(
                        @Param("studentId") Long studentId,
                        @Param("semester") Semester semester,
                        @Param("schoolYear") String schoolYear);
}