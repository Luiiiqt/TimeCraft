package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.Teacher;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    // ── Lookup ────────────────────────────────────────────────────────────────

    Optional<Teacher> findByEmail(String email);

    Optional<Teacher> findBySchoolId(String schoolId);

    boolean existsByEmail(String email);

    boolean existsBySchoolId(String schoolId);

    // ── Filter ────────────────────────────────────────────────────────────────

    List<Teacher> findByIsActiveTrue();

    // ── Department-based ──────────────────────────────────────────────────────

    @Query("SELECT t FROM Teacher t JOIN TeacherProfile tp ON tp.user = t " +
           "WHERE tp.department.id = :departmentId")
    List<Teacher> findByDepartmentId(@Param("departmentId") Long departmentId);

    @Query("SELECT t FROM Teacher t JOIN TeacherProfile tp ON tp.user = t " +
           "WHERE tp.department.id = :departmentId AND t.isActive = true")
    List<Teacher> findActiveByDepartmentId(@Param("departmentId") Long departmentId);

    // ── Campus flexibility ────────────────────────────────────────────────────

    /**
     * Returns all GE teachers flagged as campus-flexible.
     * These teachers can be assigned to rooms on either CLI or CHS.
     */
    @Query("SELECT t FROM Teacher t " +
           "JOIN TeacherProfile tp ON tp.user = t " +
           "WHERE tp.campusFlexible = true AND t.isActive = true")
    List<Teacher> findAllCampusFlexible();

    /**
     * Returns available teachers for a timeslot on a specific campus.
     * GE teachers (campusFlexible = true) are always included.
     * Dept teachers included only if their dept serves the requested campus.
     * No year-level restriction — teachers can span all year levels.
     */
    @Query("SELECT t FROM Teacher t " +
           "JOIN TeacherProfile tp ON tp.user = t " +
           "JOIN TeacherAvailability ta ON ta.teacher = t " +
           "WHERE ta.timeslot.id = :timeslotId " +
           "AND ta.available = true " +
           "AND t.isActive = true " +
           "AND (tp.campusFlexible = true OR tp.department.id IN (" +
           "  SELECT d.id FROM Department d " +
           "  JOIN Course c ON c.department = d " +
           "  JOIN Section sec ON sec.course = c " +
           "  JOIN Schedule s ON s.section = sec " +
           "  WHERE s.campus.id = :campusId))")
    List<Teacher> findAvailableByTimeslotAndCampus(
            @Param("timeslotId") Long timeslotId,
            @Param("campusId") Long campusId);

    /**
     * Flexible GE teachers who prefer a specific campus.
     * Scheduler calls this first to minimize cross-campus travel.
     * Falls back to findAllCampusFlexible if this returns empty.
     */
    @Query("SELECT t FROM Teacher t " +
           "JOIN TeacherProfile tp ON tp.user = t " +
           "JOIN TeacherAvailability ta ON ta.teacher = t " +
           "WHERE tp.campusFlexible = true " +
           "AND tp.preferredCampus.id = :preferredCampusId " +
           "AND ta.timeslot.id = :timeslotId " +
           "AND ta.available = true " +
           "AND t.isActive = true")
    List<Teacher> findFlexibleByPreferredCampusAndTimeslot(
            @Param("timeslotId") Long timeslotId,
            @Param("preferredCampusId") Long preferredCampusId);

    // ── Availability ──────────────────────────────────────────────────────────

    @Query("SELECT t FROM Teacher t " +
           "JOIN TeacherAvailability ta ON ta.teacher = t " +
           "WHERE ta.timeslot.id = :timeslotId AND ta.available = true " +
           "AND t.isActive = true")
    List<Teacher> findAvailableByTimeslot(@Param("timeslotId") Long timeslotId);

    // ── Conflict detection ────────────────────────────────────────────────────

    /**
     * Returns teachers not already assigned to a schedule in the given timeslot.
     * Applies regardless of year level — teachers are checked globally by timeslot.
     */
    @Query("SELECT t FROM Teacher t WHERE t.isActive = true " +
           "AND t.id NOT IN (" +
           "  SELECT s.teacher.id FROM Schedule s " +
           "  WHERE (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
           "  AND s.semester = :semester AND s.schoolYear = :schoolYear)")
    List<Teacher> findUnscheduledAtTimeslot(
            @Param("timeslotId") Long timeslotId,
            @Param("semester") String semester,
            @Param("schoolYear") String schoolYear);

    // ── Search ────────────────────────────────────────────────────────────────

    @Query("SELECT t FROM Teacher t " +
           "WHERE LOWER(t.fullName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Teacher> searchByName(@Param("name") String name);
}