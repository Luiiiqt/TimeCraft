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

    List<Schedule> findBySemesterAndSchoolYear(Semester semester,
                                                String schoolYear);

    List<Schedule> findBySemesterAndSchoolYearAndStatus(Semester semester,
                                                         String schoolYear,
                                                         ScheduleStatus status);

    // ── Teacher view ──────────────────────────────────────────────────────────

    List<Schedule> findByTeacherIdAndSemesterAndSchoolYear(Long teacherId,
                                                            Semester semester,
                                                            String schoolYear);

    /**
     * Full teacher schedule across ALL year levels for a term.
     * Ordered by year level then timeslot for a clean weekly view.
     */
    @Query("SELECT s FROM Schedule s " +
           "JOIN FETCH s.subject sub " +
           "JOIN FETCH s.section sec " +
           "JOIN FETCH sec.course c " +
           "WHERE s.teacher.id = :teacherId " +
           "AND s.semester = :semester " +
           "AND s.schoolYear = :schoolYear " +
           "ORDER BY sec.yearLevel ASC, s.timeslot.slotNumber ASC")
    List<Schedule> findFullLoadByTeacherAndTerm(
            @Param("teacherId") Long teacherId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    /**
     * Count of classes per year level for a teacher.
     * Used in the teaching load report.
     * Returns: [year_level, count]
     */
    @Query("SELECT sec.yearLevel, COUNT(s) " +
           "FROM Schedule s " +
           "JOIN s.section sec " +
           "WHERE s.teacher.id = :teacherId " +
           "AND s.semester = :semester " +
           "AND s.schoolYear = :schoolYear " +
           "GROUP BY sec.yearLevel " +
           "ORDER BY sec.yearLevel ASC")
    List<Object[]> countClassesByYearLevelForTeacher(
            @Param("teacherId") Long teacherId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

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

    // ── Campus view ───────────────────────────────────────────────────────────

    List<Schedule> findByCampusIdAndSemesterAndSchoolYear(Long campusId,
                                                           Semester semester,
                                                           String schoolYear);

    // ── Status ────────────────────────────────────────────────────────────────

    List<Schedule> findByStatus(ScheduleStatus status);

    long countBySemesterAndSchoolYearAndStatus(Semester semester,
                                               String schoolYear,
                                               ScheduleStatus status);

    // ── Student schedule ──────────────────────────────────────────────────────

    /**
     * All schedules a student is enrolled in — both regular and irregular.
     */
    @Query("SELECT sc FROM Schedule sc " +
           "JOIN StudentSchedule ss ON ss.schedule = sc " +
           "WHERE ss.student.id = :studentId " +
           "AND sc.semester = :semester AND sc.schoolYear = :schoolYear")
    List<Schedule> findByStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    // ── Conflict detection ────────────────────────────────────────────────────

    /**
     * Checks if a teacher is already booked at the given timeslot.
     * Applies to BOTH session days (timeslot_id and timeslot2_id).
     * No year-level filter — teacher conflicts are checked globally.
     */
    @Query("SELECT s FROM Schedule s " +
           "WHERE s.teacher.id = :teacherId " +
           "AND (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
           "AND s.semester = :semester AND s.schoolYear = :schoolYear")
    List<Schedule> findTeacherConflicts(
            @Param("teacherId") Long teacherId,
            @Param("timeslotId") Long timeslotId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    /**
     * Checks if a room is already booked at the given timeslot.
     */
    @Query("SELECT s FROM Schedule s " +
           "WHERE s.room.id = :roomId " +
           "AND (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
           "AND s.semester = :semester AND s.schoolYear = :schoolYear")
    List<Schedule> findRoomConflicts(
            @Param("roomId") Long roomId,
            @Param("timeslotId") Long timeslotId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    /**
     * Checks if a section already has a class at the given timeslot.
     */
    @Query("SELECT s FROM Schedule s " +
           "WHERE s.section.id = :sectionId " +
           "AND (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
           "AND s.semester = :semester AND s.schoolYear = :schoolYear")
    List<Schedule> findSectionConflicts(
            @Param("sectionId") Long sectionId,
            @Param("timeslotId") Long timeslotId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    // ── Reporting ─────────────────────────────────────────────────────────────

    /**
     * Teaching load report — count of schedule entries per teacher per term.
     */
    @Query("SELECT s.teacher.id, s.teacher.fullName, COUNT(s) " +
           "FROM Schedule s " +
           "WHERE s.semester = :semester AND s.schoolYear = :schoolYear " +
           "GROUP BY s.teacher.id, s.teacher.fullName " +
           "ORDER BY COUNT(s) DESC")
    List<Object[]> getTeachingLoadReport(
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    /**
     * Duplicate subject check within a section for the same term.
     */
    Optional<Schedule> findBySectionIdAndSubjectIdAndSemesterAndSchoolYear(
            Long sectionId, Long subjectId,
            Semester semester, String schoolYear);
}