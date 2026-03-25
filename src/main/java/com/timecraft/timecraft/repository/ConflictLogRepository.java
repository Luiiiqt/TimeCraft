package com.timecraft.timecraft.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.ConflictLog;
import com.timecraft.timecraft.model.ConflictLog.ConflictType;
import com.timecraft.timecraft.model.CourseSubject.Semester;

@Repository
public interface ConflictLogRepository extends JpaRepository<ConflictLog, Long> {

    // ── Admin dashboard ───────────────────────────────────────────────────────

    List<ConflictLog> findByResolvedFalse();

    List<ConflictLog> findByResolvedFalseOrderByDetectedAtDesc();

    long countByResolvedFalse();

    // ── Filter by type ────────────────────────────────────────────────────────

    List<ConflictLog> findByConflictType(ConflictType conflictType);

    List<ConflictLog> findByConflictTypeAndResolvedFalse(ConflictType conflictType);

    // ── Filter by schedule ────────────────────────────────────────────────────

    List<ConflictLog> findByScheduleId(Long scheduleId);

    List<ConflictLog> findByScheduleIdAndResolvedFalse(Long scheduleId);

    // ── Term-based ────────────────────────────────────────────────────────────

    @Query("SELECT cl FROM ConflictLog cl " +
           "JOIN cl.schedule sc " +
           "WHERE sc.semester = :semester AND sc.schoolYear = :schoolYear " +
           "ORDER BY cl.detectedAt DESC")
    List<ConflictLog> findByTerm(
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    @Query("SELECT cl FROM ConflictLog cl " +
           "JOIN cl.schedule sc " +
           "WHERE sc.semester = :semester AND sc.schoolYear = :schoolYear " +
           "AND cl.resolved = false")
    List<ConflictLog> findUnresolvedByTerm(
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);

    // ── Resolution ────────────────────────────────────────────────────────────

    /** Bulk-resolve all conflicts for a schedule when admin fixes it. */
    @Modifying
    @Transactional
    @Query("UPDATE ConflictLog cl " +
           "SET cl.resolved = true, cl.resolvedAt = CURRENT_TIMESTAMP " +
           "WHERE cl.schedule.id = :scheduleId AND cl.resolved = false")
    void resolveAllByScheduleId(@Param("scheduleId") Long scheduleId);

    /** Clears all conflict records for a term before re-generating. */
    @Modifying
    @Transactional
    @Query("DELETE FROM ConflictLog cl " +
           "WHERE cl.schedule.id IN (" +
           "  SELECT s.id FROM Schedule s " +
           "  WHERE s.semester = :semester AND s.schoolYear = :schoolYear)")
    void deleteAllByTerm(
            @Param("semester") Semester semester,
            @Param("schoolYear") String schoolYear);
}