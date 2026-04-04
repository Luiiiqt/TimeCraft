package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.TeacherAvailability;

@Repository
public interface TeacherAvailabilityRepository
        extends JpaRepository<TeacherAvailability, Long> {

    List<TeacherAvailability> findByTeacherId(Long teacherId);

    Optional<TeacherAvailability> findByTeacherIdAndTimeslotId(
            Long teacherId, Long timeslotId);

    List<TeacherAvailability> findByTeacherIdAndAvailableTrue(Long teacherId);

    List<TeacherAvailability> findByTimeslotIdAndAvailableTrue(Long timeslotId);

    boolean existsByTeacherIdAndTimeslotIdAndAvailableTrue(
            Long teacherId, Long timeslotId);

    boolean existsByTeacherIdAndAvailableTrue(Long teacherId);

    @Modifying
    @Transactional
    void deleteByTeacherId(Long teacherId);
}