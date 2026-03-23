package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.Schedule.ScheduleStatus;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    // ── Term-based fetching ───────────────────────────────────────────────────

    List<Schedule> findBySemesterAndSchoolYear(Semester semester, String schoolYear);

    List<Schedule> findBySemesterAndSchoolYearAndStatus(Semester semester,
                                                         String schoolYear,
                                                         ScheduleStatus status);

    // ── Teacher view ──────────────────────────────────────────────────────────

    List<Schedule> findByTeacherIdAndSemesterAndSchoolYear(Long teacherId,
                                                            Semester semester,
                                                            String schoolYear);

    // ── Section view ──────────────────────────────────────────────────────────

    List<Schedule> findBySectionIdAndSemesterAndSchoolYear(Long sectionId,
                                                            Semester semester,
                                                            String schoolYear);

    // ── Subject view ──────────────────────────────────────────────────────────

    List<Schedule> findBySubjectIdAndSemesterAndSchoolYear(Long subjectId,
                                                            Semester semester,
                                                            String schoolYear);

    // ── Room view ─────────────────────────────────────────────────────────────

    List<Schedule> findByRoomIdAndSemesterAndSchoolYear(Long roomId,
                                                         Semester semester,
                                                         String schoolYear);

    // ── Status ────────────────────────────────────────────────────────────────

    List<Schedule> findByStatus(ScheduleStatus status);

    long countBySemesterAndSchoolYearAndStatus(Semester semester,
                                               String schoolYear,
                                               ScheduleStatus status);

    // ── Student schedule (via StudentSchedule join) ───────────────────────────

    /**
     * Returns all schedules a student is enrolled in
     * (both regular block and individually assigned irregular).
     */
    @Query("SELECT sc FROM Schedule sc " +
           "JOIN StudentSchedule ss ON ss.schedule = sc " +
           "WHERE ss.student.id = :studentId " +
           "AND sc.semester = :semester AND sc.schoolYear = :schoolYear")
    List<Schedule> findByStudentAndTerm(@Param("studentId") Long studentId,
                                         @Param("semester") Semester semester,
                                         @Param("schoolYear") String schoolYear);

    // ── Conflict detection ────────────────────────────────────────────────────

    /**
     * Checks if a teacher is already scheduled in a given timeslot
     * (in either session 1 or session 2) for the term.
     */
    @Query("SELECT s FROM Schedule s " +
           "WHERE s.teacher.id = :teacherId " +
           "AND (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
           "AND s.semester = :semester AND s.schoolYear = :schoolYear")
    List<Schedule> findTeacherConflicts(@Param("teacherId") Long teacherId,
                                         @Param("timeslotId") Long timeslotId,
                                         @Param("semester") Semester semester,
                                         @Param("schoolYear") String schoolYear);

    /**
     * Checks if a room is already booked in a given timeslot
     * (in either session 1 or session 2) for the term.
     */
    @Query("SELECT s FROM Schedule s " +
           "WHERE s.room.id = :roomId " +
           "AND (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
           "AND s.semester = :semester AND s.schoolYear = :schoolYear")
    List<Schedule> findRoomConflicts(@Param("roomId") Long roomId,
                                      @Param("timeslotId") Long timeslotId,
                                      @Param("semester") Semester semester,
                                      @Param("schoolYear") String schoolYear);

    /**
     * Checks if a section already has a class scheduled at a given timeslot.
     * Used to prevent section-level time conflicts.
     */
    @Query("SELECT s FROM Schedule s " +
           "WHERE s.section.id = :sectionId " +
           "AND (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
           "AND s.semester = :semester AND s.schoolYear = :schoolYear")
    List<Schedule> findSectionConflicts(@Param("sectionId") Long sectionId,
                                         @Param("timeslotId") Long timeslotId,
                                         @Param("semester") Semester semester,
                                         @Param("schoolYear") String schoolYear);

    // ── Campus-based ─────────────────────────────────────────────────────────

    List<Schedule> findByCampusIdAndSemesterAndSchoolYear(Long campusId,
                                                           Semester semester,
                                                           String schoolYear);

    // ── Reporting ────────────────────────────────────────────────────────────

    /**
     * Teaching load report: counts schedule entries per teacher for a term.
     */
    @Query("SELECT s.teacher.id, s.teacher.fullName, COUNT(s) " +
           "FROM Schedule s " +
           "WHERE s.semester = :semester AND s.schoolYear = :schoolYear " +
           "GROUP BY s.teacher.id, s.teacher.fullName " +
           "ORDER BY COUNT(s) DESC")
    List<Object[]> getTeachingLoadReport(@Param("semester") Semester semester,
                                          @Param("schoolYear") String schoolYear);

    /**
     * Returns an exact existing schedule to check for duplicate subject
     * assignment within the same section and term.
     */
    Optional<Schedule> findBySectionIdAndSubjectIdAndSemesterAndSchoolYear(
            Long sectionId, Long subjectId, Semester semester, String schoolYear);
}