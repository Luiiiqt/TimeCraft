package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.TeacherAvailability;

@Repository
public interface TeacherAvailabilityRepository extends JpaRepository<TeacherAvailability, Long> {

    // ── Lookup ────────────────────────────────────────────────────────────────

    List<TeacherAvailability> findByTeacherId(Long teacherId);

    Optional<TeacherAvailability> findByTeacherIdAndTimeslotId(Long teacherId,
                                                                Long timeslotId);

    // ── Available-only ────────────────────────────────────────────────────────

    /** Returns only slots the teacher marked as available (used by scheduling engine). */
    List<TeacherAvailability> findByTeacherIdAndAvailableTrue(Long teacherId);

    /** Returns all available declarations for a specific timeslot. */
    List<TeacherAvailability> findByTimeslotIdAndAvailableTrue(Long timeslotId);

    boolean existsByTeacherIdAndTimeslotIdAndAvailableTrue(Long teacherId,
                                                            Long timeslotId);

    // ── Bulk operations ───────────────────────────────────────────────────────

    /** Clears all availability records for a teacher — used before saving a new set. */
    @Modifying
    @Transactional
    void deleteByTeacherId(Long teacherId);
}