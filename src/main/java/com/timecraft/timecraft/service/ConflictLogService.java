package com.timecraft.timecraft.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.ConflictLog;
import com.timecraft.timecraft.model.ConflictLog.ConflictType;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.repository.ConflictLogRepository;
import com.timecraft.timecraft.repository.ScheduleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConflictLogService {

    private final ConflictLogRepository conflictLogRepository;
    private final ScheduleRepository scheduleRepository;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public ConflictLog findById(Long id) {
        return conflictLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Conflict log not found: " + id));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<ConflictLog> findAllUnresolved() {
        return conflictLogRepository.findByResolvedFalseOrderByDetectedAtDesc();
    }

    public long countUnresolved() {
        return conflictLogRepository.countByResolvedFalse();
    }

    public List<ConflictLog> findBySchedule(Long scheduleId) {
        return conflictLogRepository.findByScheduleId(scheduleId);
    }

    public List<ConflictLog> findByType(ConflictType type) {
        return conflictLogRepository.findByConflictType(type);
    }

    public List<ConflictLog> findUnresolvedByTerm(Semester semester,
            String schoolYear) {
        return conflictLogRepository.findUnresolvedByTerm(semester, schoolYear);
    }

    // ── Log a conflict (called by SchedulingEngine) ───────────────────────────

    @Transactional
    public ConflictLog log(Schedule schedule, ConflictType type,
            String description) {
        // Mark the related schedule as CONFLICTED
        schedule.setStatus(Schedule.ScheduleStatus.CONFLICTED);
        scheduleRepository.save(schedule);

        return conflictLogRepository.save(ConflictLog.builder()
                .schedule(schedule)
                .conflictType(type)
                .description(description)
                .resolved(false)
                .build());
    }

    // ── Resolve ───────────────────────────────────────────────────────────────

    @Transactional
    public void resolve(Long conflictId) {
        ConflictLog conflict = findById(conflictId);
        conflict.setResolved(true);
        conflict.setResolvedAt(LocalDateTime.now());
        conflictLogRepository.save(conflict);

        // If all conflicts for this schedule are now resolved, publish it
        if (conflict.getSchedule() != null) {
            long remaining = conflictLogRepository
                    .findByScheduleIdAndResolvedFalse(
                            conflict.getSchedule().getId())
                    .size();
            if (remaining == 0) {
                Schedule schedule = conflict.getSchedule();
                schedule.setStatus(Schedule.ScheduleStatus.PUBLISHED);
                scheduleRepository.save(schedule);
            }
        }
    }

    @Transactional
    public void resolveAllForSchedule(Long scheduleId) {
        conflictLogRepository.resolveAllByScheduleId(scheduleId);
        scheduleRepository.findById(scheduleId).ifPresent(s -> {
            s.setStatus(Schedule.ScheduleStatus.PUBLISHED);
            scheduleRepository.save(s);
        });
    }

    @Transactional
    public void clearAllForTerm(Semester semester, String schoolYear) {
        conflictLogRepository.deleteAllByTerm(semester, schoolYear);
    }
}