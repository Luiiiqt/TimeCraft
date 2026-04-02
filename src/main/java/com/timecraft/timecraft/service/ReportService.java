package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.repository.ConflictLogRepository;
import com.timecraft.timecraft.repository.RoomRepository;
import com.timecraft.timecraft.repository.ScheduleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ScheduleRepository scheduleRepository;
    private final ConflictLogRepository conflictLogRepository;
    private final RoomRepository roomRepository;

    /**
     * Teaching load report — how many classes each teacher has in the term.
     * Returns: [teacher_id, teacher_full_name, class_count]
     */
    public List<Object[]> getTeachingLoadReport(Semester semester,
            String schoolYear) {
        return scheduleRepository.getTeachingLoadReport(semester, schoolYear);
    }

    /**
     * Teaching load by year level for a single teacher.
     * Returns: [year_level, class_count]
     */
    public List<Object[]> getTeacherLoadByYearLevel(Long teacherId,
            Semester semester,
            String schoolYear) {
        return scheduleRepository.countClassesByYearLevelForTeacher(
                teacherId, semester, schoolYear);
    }

    /**
     * Room utilisation report per campus.
     * Returns: [Room, scheduled_count]
     */
    public List<Object[]> getRoomUtilisationReport(Long campusId,
            Semester semester,
            String schoolYear) {
        return roomRepository.getRoomUtilisationByCampusAndTerm(
                campusId, semester, schoolYear);
    }

    /**
     * Total unresolved conflicts across the system.
     */
    public long getTotalUnresolvedConflicts() {
        return conflictLogRepository.countByResolvedFalse();
    }

    /**
     * Conflict summary for a specific term.
     */
    public long getUnresolvedConflictsByTerm(Semester semester,
            String schoolYear) {
        return conflictLogRepository
                .findUnresolvedByTerm(semester, schoolYear).size();
    }
}