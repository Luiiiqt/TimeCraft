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
     * Full teacher schedule across ALL year levels for a term. Ordered by year
     * level then timeslot for a clean weekly view.
     */
    @Query("SELECT s FROM Schedule s "
            + "JOIN FETCH s.subject sub "
            + "JOIN FETCH s.section sec "
            + "JOIN FETCH sec.course c "
            + "WHERE s.teacher.id = :teacherId "
            + "AND s.semester = :semester "
            + "AND s.schoolYear = :schoolYear "
            + "ORDER BY sec.yearLevel ASC, s.timeslot.slotNumber ASC")
    List<Schedule> findFullLoadByTeacherAndTerm(
            @Param("teacherId") Long teacherId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    /**
     * Count of classes per year level for a teacher. Used in the teaching load
     * report. Returns: [year_level, count]
     */
    @Query("SELECT sec.yearLevel, COUNT(s) "
            + "FROM Schedule s "
            + "JOIN s.section sec "
            + "WHERE s.teacher.id = :teacherId "
            + "AND s.semester = :semester "
            + "AND s.schoolYear = :schoolYear "
            + "GROUP BY sec.yearLevel "
            + "ORDER BY sec.yearLevel ASC")
    List<Object[]> countClassesByYearLevelForTeacher(
            @Param("teacherId") Long teacherId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    // ── Section view ──────────────────────────────────────────────────────────
    @Query("SELECT DISTINCT s FROM Schedule s "
            + "LEFT JOIN s.mergedSection ms "
            + "WHERE s.semester = :semester "
            + "AND s.schoolYear = :schoolYear "
            + "AND s.status != com.timecraft.timecraft.model.Schedule.ScheduleStatus.CONFLICTED "
            + "AND ("
            + "  s.section.id = :sectionId "
            + "  OR ms.secondarySection.id = :sectionId"
            + ")")
    List<Schedule> findBySectionIdAndSemesterAndSchoolYear(
            @Param("sectionId") Long sectionId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

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
    @Query("SELECT sc FROM Schedule sc "
            + "JOIN StudentSchedule ss ON ss.schedule = sc "
            + "WHERE ss.student.id = :studentId "
            + "AND sc.semester = :semester AND sc.schoolYear = :schoolYear")
    List<Schedule> findByStudentAndTerm(
            @Param("studentId") Long studentId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    // ── Conflict detection ────────────────────────────────────────────────────
    /**
     * Checks if a teacher is already booked at the given timeslot. Applies to
     * BOTH session days (timeslot_id and timeslot2_id). No year-level filter —
     * teacher conflicts are checked globally.
     */
    @Query(value = "SELECT s.* FROM schedules s "
            + "JOIN timeslots chk ON chk.id = :timeslotId "
            + "LEFT JOIN timeslots ts1 ON ts1.id = s.timeslot_id "
            + "LEFT JOIN timeslots ts2 ON ts2.id = s.timeslot2_id "
            + "WHERE s.teacher_id = :teacherId "
            + "AND s.status = 'DRAFT' "
            + "AND s.semester = :semester AND s.school_year = :schoolYear "
            + "AND ("
            + "  (ts1.day_of_week = chk.day_of_week AND ts1.start_time < chk.end_time AND chk.start_time < ts1.end_time) "
            + "  OR (ts2.day_of_week = chk.day_of_week AND ts2.start_time < chk.end_time AND chk.start_time < ts2.end_time)"
            + ")",
            nativeQuery = true)
    List<Schedule> findTeacherConflicts(
            @Param("teacherId") Long teacherId,
            @Param("timeslotId") Long timeslotId,
            @Param("semester") String semester,
            @Param("schoolYear") String schoolYear);

    /**
     * Checks if a room is already booked at the given timeslot.
     */
        @Query(value = "SELECT s.* FROM schedules s "
                + "JOIN timeslots chk ON chk.id = :timeslotId "
                + "LEFT JOIN timeslots ts1 ON ts1.id = s.timeslot_id "
                + "LEFT JOIN timeslots ts2 ON ts2.id = s.timeslot2_id "
                + "WHERE s.room_id = :roomId "
                + "AND s.status = 'DRAFT' "
                + "AND s.semester = :semester AND s.school_year = :schoolYear "
                + "AND ("
                + "  (ts1.day_of_week = chk.day_of_week AND ts1.start_time < chk.end_time AND chk.start_time < ts1.end_time) "
                + "  OR (ts2.day_of_week = chk.day_of_week AND ts2.start_time < chk.end_time AND chk.start_time < ts2.end_time)"
                + ")",
                nativeQuery = true)
        List<Schedule> findRoomConflicts(
                @Param("roomId") Long roomId,
                @Param("timeslotId") Long timeslotId,
                @Param("semester") String semester,
                @Param("schoolYear") String schoolYear);
    /**
     * Checks if a section already has a class at the given timeslot.
     */
    @Query(value = "SELECT s.* FROM schedules s "
            + "JOIN timeslots chk ON chk.id = :timeslotId "
            + "LEFT JOIN timeslots ts1 ON ts1.id = s.timeslot_id "
            + "LEFT JOIN timeslots ts2 ON ts2.id = s.timeslot2_id "
            + "WHERE s.section_id = :sectionId "
            + "AND s.status = 'DRAFT' "
            + "AND s.semester = :semester AND s.school_year = :schoolYear "
            + "AND ("
            + "  (ts1.day_of_week = chk.day_of_week AND ts1.start_time < chk.end_time AND chk.start_time < ts1.end_time) "
            + "  OR (ts2.day_of_week = chk.day_of_week AND ts2.start_time < chk.end_time AND chk.start_time < ts2.end_time)"
            + ")",
            nativeQuery = true)
    List<Schedule> findSectionConflicts(
            @Param("sectionId") Long sectionId,
            @Param("timeslotId") Long timeslotId,
            @Param("semester") String semester,
            @Param("schoolYear") String schoolYear);

    // ── Load balancing ────────────────────────────────────────────────────────
    /**
     * Count of DRAFT schedules per teacher — used by the engine to distribute
     * teaching load evenly across teachers in a department.
     */
    long countByTeacherIdAndStatus(Long teacherId, ScheduleStatus status);

    // ── Reporting ─────────────────────────────────────────────────────────────
    /**
     * Teaching load report — count of schedule entries per teacher per term.
     */
    @Query("SELECT s.teacher.id, s.teacher.fullName, COUNT(s) "
            + "FROM Schedule s "
            + "WHERE s.semester = :semester AND s.schoolYear = :schoolYear "
            + "GROUP BY s.teacher.id, s.teacher.fullName "
            + "ORDER BY COUNT(s) DESC")
    List<Object[]> getTeachingLoadReport(
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    /**
     * Duplicate subject check within a section for the same term.
     */
    Optional<Schedule> findBySectionIdAndSubjectIdAndSemesterAndSchoolYear(
            Long sectionId, Long subjectId,
            Semester semester, String schoolYear);

    // ── Back subjects ─────────────────────────────────────────────────────────
    @Query("SELECT s FROM Schedule s "
            + "WHERE s.status = com.timecraft.timecraft.model.Schedule.ScheduleStatus.PUBLISHED "
            + "AND s.semester = :semester "
            + "AND s.schoolYear = :schoolYear "
            + "AND s.section IS NOT NULL")
    List<Schedule> findPublishedBySemesterAndSchoolYear(
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    // ── Student enrollment check ──────────────────────────────────────────────
    @Query("SELECT s FROM Schedule s "
            + "JOIN s.section sec "
            + "WHERE sec.id IN ("
            + "  SELECT sec2.id FROM Section sec2 "
            + "  WHERE sec2.course.id IN ("
            + "    SELECT sp.course.id FROM StudentProfile sp "
            + "    WHERE sp.user.id = :studentId"
            + "  )"
            + ") "
            + "AND s.status = 'PUBLISHED' "
            + "AND s.semester = :semester "
            + "AND s.schoolYear = :schoolYear")
    List<Schedule> findEnrollableByStudent(
            @Param("studentId") Long studentId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    /**
     * All DRAFT schedules for a section in a term. Used by the engine to count
     * day load for spreading subjects.
     */
    @Query("SELECT s FROM Schedule s "
            + "WHERE s.section.id = :sectionId "
            + "AND s.semester = :semester "
            + "AND s.schoolYear = :schoolYear "
            + "AND s.status = com.timecraft.timecraft.model.Schedule.ScheduleStatus.DRAFT")
    List<Schedule> findSectionSchedules(
            @Param("sectionId") Long sectionId,
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    // ── Lock check ────────────────────────────────────────────────────────────
    boolean existsBySectionCourseIdAndSemesterAndSchoolYearAndStatus(
            Long courseId, Semester semester,
            String schoolYear, ScheduleStatus status);

    /**
     * All schedules that are part of a merged class for a given term.
     */
    @Query("SELECT s FROM Schedule s "
            + "WHERE s.mergedSection IS NOT NULL "
            + "AND s.semester = :semester "
            + "AND s.schoolYear = :schoolYear")
    List<Schedule> findMergedSchedulesByTerm(
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);


}
