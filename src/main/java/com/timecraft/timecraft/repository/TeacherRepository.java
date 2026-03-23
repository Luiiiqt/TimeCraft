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

    // ── Availability ──────────────────────────────────────────────────────────

    /**
     * Returns teachers who have declared themselves available
     * for a specific timeslot.
     */
    @Query("SELECT t FROM Teacher t " +
           "JOIN TeacherAvailability ta ON ta.teacher = t " +
           "WHERE ta.timeslot.id = :timeslotId AND ta.available = true " +
           "AND t.isActive = true")
    List<Teacher> findAvailableByTimeslot(@Param("timeslotId") Long timeslotId);

    // ── Schedule conflict detection ───────────────────────────────────────────

    /**
     * Returns teachers who are NOT already assigned to a schedule
     * in either the first or second timeslot for the given term.
     */
    @Query("SELECT t FROM Teacher t WHERE t.isActive = true " +
           "AND t.id NOT IN (" +
           "  SELECT s.teacher.id FROM Schedule s " +
           "  WHERE (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
           "  AND s.semester = :semester AND s.schoolYear = :schoolYear" +
           ")")
    List<Teacher> findUnscheduledAtTimeslot(@Param("timeslotId") Long timeslotId,
                                             @Param("semester") String semester,
                                             @Param("schoolYear") String schoolYear);

    // ── Search ────────────────────────────────────────────────────────────────

    @Query("SELECT t FROM Teacher t " +
           "WHERE LOWER(t.fullName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Teacher> searchByName(@Param("name") String name);
}