package com.timecraft.timecraft.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.ConflictLog.ConflictType;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Room.RoomType;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.Subject.SessionType;
import com.timecraft.timecraft.model.TeacherProfile;
import com.timecraft.timecraft.repository.ConflictLogRepository;
import com.timecraft.timecraft.repository.ScheduleRepository;
import com.timecraft.timecraft.repository.StudentScheduleRepository;
import com.timecraft.timecraft.repository.TeacherProfileRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ConflictDetectionService
 *
 * Responsible for detecting and reporting all scheduling conflicts. This
 * service is called in two contexts:
 *
 * 1. Pre-assignment (by SchedulingEngine) — to validate before saving 2.
 * Post-assignment audit (by admin or scheduled job) — to scan existing
 * schedules and surface any conflicts introduced by manual overrides
 *
 * Each check returns a ConflictResult which contains the conflict type, a
 * human-readable description, and whether it is blocking (hard conflict) or
 * advisory (soft warning).
 *
 * Hard conflicts (block scheduling): - TEACHER_DOUBLE_BOOKED -
 * ROOM_DOUBLE_BOOKED - STUDENT_TIME_CONFLICT - TEACHER_UNAVAILABLE -
 * WRONG_ROOM_TYPE - WRONG_CAMPUS
 *
 * Soft warnings (logged but not blocking): - WRONG_DEPARTMENT (teacher outside
 * their dept — flagged, not blocked)
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConflictDetectionService {

    private final ScheduleRepository scheduleRepository;
    private final StudentScheduleRepository studentScheduleRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final ConflictLogRepository conflictLogRepository;
    private final ConflictLogService conflictLogService;

    // Health department codes — must use CHS campus
    private static final List<String> HEALTH_DEPT_CODES = List.of(
            "CON", "CORT", "CMLS", "COP", "CORT2", "COPT");

    // ── Pre-assignment checks (called before saving a schedule) ───────────────
    /**
     * Runs all hard conflict checks for a proposed schedule assignment. Returns
     * a list of detected conflicts. Empty list = no conflicts.
     *
     * Call this before persisting any Schedule entry — either from the
     * SchedulingEngine or from a manual admin override.
     */
    public List<ConflictResult> checkPreAssignment(
            Long teacherId,
            Long roomId,
            Long sectionId,
            Long timeslot1Id,
            Long timeslot2Id,
            Semester semester,
            String schoolYear,
            Schedule proposedSchedule) {

        List<ConflictResult> conflicts = new ArrayList<>();

        // 2. Teacher double-booking (session 1)
        conflicts.addAll(checkTeacherDoubleBooked(
                teacherId, timeslot1Id, semester, schoolYear));

        // 3. Teacher double-booking (session 2)
        conflicts.addAll(checkTeacherDoubleBooked(
                teacherId, timeslot2Id, semester, schoolYear));

        // 4. Room double-booking (session 1)
        conflicts.addAll(checkRoomDoubleBooked(
                roomId, timeslot1Id, semester, schoolYear));

        // 5. Room double-booking (session 2)
        conflicts.addAll(checkRoomDoubleBooked(
                roomId, timeslot2Id, semester, schoolYear));

        // 6. Section time conflict (session 1)
        conflicts.addAll(checkSectionConflict(
                sectionId, timeslot1Id, semester, schoolYear));

        // 7. Section time conflict (session 2)
        conflicts.addAll(checkSectionConflict(
                sectionId, timeslot2Id, semester, schoolYear));

        // 8. Room type vs subject session type
        if (proposedSchedule != null) {
            conflicts.addAll(checkRoomType(proposedSchedule));
        }

        // 9. Campus assignment (health courses must use CHS)
        if (proposedSchedule != null) {
            conflicts.addAll(checkCampus(proposedSchedule));
        }

        // 10. Teacher department match (soft warning — does not block)
        if (proposedSchedule != null) {
            conflicts.addAll(checkTeacherDepartment(teacherId, proposedSchedule));
        }

        return conflicts;
    }

    public List<ConflictResult> checkPreAssignmentExcluding(
            Long excludeScheduleId,
            Long teacherId,
            Long roomId,
            Long sectionId,
            Long timeslot1Id,
            Long timeslot2Id,
            Semester semester,
            String schoolYear,
            Schedule proposedSchedule) {

        List<ConflictResult> conflicts = new ArrayList<>();

        // Teacher double-booking — exclude self
        List<Schedule> teacherClash1 = scheduleRepository.findTeacherConflicts(
                teacherId, timeslot1Id, semester.name(), schoolYear)
                .stream().filter(s -> !s.getId().equals(excludeScheduleId)).toList();
        List<Schedule> teacherClash2 = scheduleRepository.findTeacherConflicts(
                teacherId, timeslot2Id, semester.name(), schoolYear)
                .stream().filter(s -> !s.getId().equals(excludeScheduleId)).toList();

        if (!teacherClash1.isEmpty()) {
            Schedule clash = teacherClash1.get(0);
            // Skip if same subject shared across sections (same teacher, same timeslot, different section)
            boolean isSharedSubject = clash.getSubject().getId()
                    .equals(proposedSchedule.getSubject().getId());
            if (!isSharedSubject) {
                conflicts.add(new ConflictResult(ConflictType.TEACHER_DOUBLE_BOOKED,
                        "Teacher already assigned to " + clash.getSubject().getCode()
                        + " (section: " + (clash.getSection() != null
                        ? clash.getSection().getDisplayLabel() : "N/A")
                        + ") at this timeslot", true));
            }
        }
        if (!teacherClash2.isEmpty()) {
            Schedule clash = teacherClash2.get(0);
            boolean isSharedSubject = clash.getSubject().getId()
                    .equals(proposedSchedule.getSubject().getId());
            if (!isSharedSubject) {
                conflicts.add(new ConflictResult(ConflictType.TEACHER_DOUBLE_BOOKED,
                        "Teacher already assigned to " + clash.getSubject().getCode()
                        + " (section: " + (clash.getSection() != null
                        ? clash.getSection().getDisplayLabel() : "N/A")
                        + ") at this timeslot", true));
            }
        }

        // Room double-booking — exclude self and shared subjects (different rooms per section now)
        List<Schedule> roomClash1 = scheduleRepository.findRoomConflicts(
                roomId, timeslot1Id, semester.name(), schoolYear)
                .stream().filter(s -> !s.getId().equals(excludeScheduleId)).toList();
        List<Schedule> roomClash2 = scheduleRepository.findRoomConflicts(
                roomId, timeslot2Id, semester.name(), schoolYear)
                .stream().filter(s -> !s.getId().equals(excludeScheduleId)).toList();

        if (!roomClash1.isEmpty()) {
            conflicts.add(new ConflictResult(ConflictType.ROOM_DOUBLE_BOOKED,
                    "Room already occupied by " + roomClash1.get(0).getSubject().getCode()
                    + " at this timeslot", true));
        }
        if (!roomClash2.isEmpty()) {
            conflicts.add(new ConflictResult(ConflictType.ROOM_DOUBLE_BOOKED,
                    "Room already occupied by " + roomClash2.get(0).getSubject().getCode()
                    + " at this timeslot", true));
        }

        // Section conflict — exclude self
        if (sectionId != null) {
            List<Schedule> secClash1 = scheduleRepository.findSectionConflicts(
                    sectionId, timeslot1Id, semester.name(), schoolYear)
                    .stream().filter(s -> !s.getId().equals(excludeScheduleId)).toList();
            List<Schedule> secClash2 = scheduleRepository.findSectionConflicts(
                    sectionId, timeslot2Id, semester.name(), schoolYear)
                    .stream().filter(s -> !s.getId().equals(excludeScheduleId)).toList();

            if (!secClash1.isEmpty()) {
                conflicts.add(new ConflictResult(ConflictType.STUDENT_TIME_CONFLICT,
                        "Section already has " + secClash1.get(0).getSubject().getCode()
                        + " scheduled at this timeslot", true));
            }
            if (!secClash2.isEmpty()) {
                conflicts.add(new ConflictResult(ConflictType.STUDENT_TIME_CONFLICT,
                        "Section already has " + secClash2.get(0).getSubject().getCode()
                        + " scheduled at this timeslot", true));
            }
        }

        // Room type and campus checks
        if (proposedSchedule != null) {
            conflicts.addAll(checkRoomType(proposedSchedule));
            conflicts.addAll(checkCampus(proposedSchedule));
            conflicts.addAll(checkTeacherDepartment(teacherId, proposedSchedule));
        }

        return conflicts;
    }

    // ── Individual check methods ───────────────────────────────────────────────
    /**
     * Checks if a teacher is already assigned to another class at this
     * timeslot. Applies to both session 1 and session 2 columns. No year-level
     * restriction — teacher conflicts are global.
     */
    public List<ConflictResult> checkTeacherDoubleBooked(Long teacherId,
            Long timeslotId,
            Semester semester,
            String schoolYear) {
        List<Schedule> existing = scheduleRepository.findTeacherConflicts(
                teacherId, timeslotId, semester.name(), schoolYear);

        if (!existing.isEmpty()) {
            Schedule clash = existing.get(0);
            String description = String.format(
                    "Teacher already assigned to %s (section: %s) at this timeslot",
                    clash.getSubject().getCode(),
                    clash.getSection() != null
                    ? clash.getSection().getDisplayLabel()
                    : "N/A");
            return List.of(new ConflictResult(
                    ConflictType.TEACHER_DOUBLE_BOOKED, description, true));
        }
        return List.of();
    }

    /**
     * Checks if a room is already booked at this timeslot. Applies to both
     * session 1 and session 2 columns.
     */
    public List<ConflictResult> checkRoomDoubleBooked(Long roomId,
            Long timeslotId,
            Semester semester,
            String schoolYear) {
        List<Schedule> existing = scheduleRepository.findRoomConflicts(
                roomId, timeslotId, semester.name(), schoolYear);

        if (!existing.isEmpty()) {
            Schedule clash = existing.get(0);
            String description = String.format(
                    "Room already occupied by %s at this timeslot",
                    clash.getSubject().getCode());
            return List.of(new ConflictResult(
                    ConflictType.ROOM_DOUBLE_BOOKED, description, true));
        }
        return List.of();
    }

    /**
     * Checks if a section already has a class at this timeslot. Prevents two
     * subjects in the same block section at the same time.
     */
    public List<ConflictResult> checkSectionConflict(Long sectionId,
            Long timeslotId,
            Semester semester,
            String schoolYear) {
        List<Schedule> existing = scheduleRepository.findSectionConflicts(
                sectionId, timeslotId, semester.name(), schoolYear);

        if (!existing.isEmpty()) {
            Schedule clash = existing.get(0);
            String description = String.format(
                    "Section already has %s scheduled at this timeslot",
                    clash.getSubject().getCode());
            return List.of(new ConflictResult(
                    ConflictType.STUDENT_TIME_CONFLICT, description, true));
        }
        return List.of();
    }

    /**
     * Checks if an individual student (irregular) has a time conflict at the
     * given timeslot.
     */
    public List<ConflictResult> checkIrregularStudentConflict(Long studentId,
            Long timeslotId,
            Semester semester,
            String schoolYear) {
        boolean hasConflict = !studentScheduleRepository
                .findStudentTimeslotConflicts(
                        studentId, timeslotId, semester, schoolYear)
                .isEmpty();

        if (hasConflict) {
            return List.of(new ConflictResult(
                    ConflictType.STUDENT_TIME_CONFLICT,
                    "Irregular student already has a class at this timeslot",
                    true));
        }
        return List.of();
    }

    /**
     * Checks that the assigned room type matches the subject's session type.
     * LABORATORY subject → must have LABORATORY room. LECTURE subject → must
     * have LECTURE room.
     */
    public List<ConflictResult> checkRoomType(Schedule schedule) {
        boolean subjectNeedsLab = schedule.getSubject().getSessionType() == SessionType.LABORATORY;
        boolean roomIsLab = schedule.getRoom().getRoomType() == RoomType.LABORATORY;

        if (subjectNeedsLab != roomIsLab) {
            String description = String.format(
                    "Subject '%s' requires a %s room but was assigned a %s room",
                    schedule.getSubject().getCode(),
                    subjectNeedsLab ? "LABORATORY" : "LECTURE",
                    roomIsLab ? "LABORATORY" : "LECTURE");
            return List.of(new ConflictResult(
                    ConflictType.WRONG_ROOM_TYPE, description, true));
        }
        return List.of();
    }

    /**
     * Checks that health-related courses are scheduled at the CHS campus.
     * Non-health courses should not be at CHS.
     */
    public List<ConflictResult> checkCampus(Schedule schedule) {
        if (schedule.getSection() == null || schedule.getCampus() == null) {
            return List.of();
        }

        String deptCode = schedule.getSection()
                .getCourse().getDepartment().getCode();
        boolean isHealth = HEALTH_DEPT_CODES.contains(deptCode);
        String assignedCampusCode = schedule.getCampus().getCode();

        if (isHealth && !"CHS".equals(assignedCampusCode)) {
            return List.of(new ConflictResult(
                    ConflictType.WRONG_CAMPUS,
                    String.format("Health course '%s' must be at CHS campus "
                            + "but was assigned to %s",
                            deptCode, assignedCampusCode),
                    true));
        }
        return List.of();
    }

    /**
     * Checks if a teacher is assigned to a subject outside their department.
     * This is a SOFT WARNING — it does not block the schedule but is flagged.
     * GE teachers (campusFlexible = true) are exempt from this check.
     */
    public List<ConflictResult> checkTeacherDepartment(Long teacherId,
            Schedule schedule) {
        TeacherProfile profile = teacherProfileRepository
                .findByUserId(teacherId).orElse(null);

        if (profile == null || profile.isGETeacher() || profile.isCrossDepartment()) {
            return List.of(); // GE and cross-department teachers are exempt
        }

        Long teacherDeptId = profile.getDepartment().getId();
        if (schedule.getSubject().getDepartment() == null) {
                        return List.of();
                }
                Long subjectDeptId = schedule.getSubject().getDepartment().getId();

        if (!teacherDeptId.equals(subjectDeptId)) {
            return List.of(new ConflictResult(
                    ConflictType.WRONG_DEPARTMENT,
                    String.format(
                            "Teacher belongs to dept '%s' but subject '%s' "
                            + "belongs to dept '%s'",
                            profile.getDepartment().getCode(),
                            schedule.getSubject().getCode(),
                            schedule.getSubject().getDepartment().getCode()),
                    false)); // soft warning — not a hard block
        }
        return List.of();
    }

    // ── Post-assignment audit ──────────────────────────────────────────────────
    /**
     * Scans ALL published and draft schedules for a term and surfaces any
     * conflicts introduced by manual admin overrides. Logs new conflict entries
     * for any violations found.
     *
     * Run this after bulk imports or manual schedule edits.
     */
    @Transactional
    public int auditTerm(Semester semester, String schoolYear) {
        log.info("Starting conflict audit for {} {}", semester, schoolYear);

        List<Schedule> schedules = scheduleRepository
                .findBySemesterAndSchoolYear(semester, schoolYear);

        int conflictCount = 0;

        for (Schedule schedule : schedules) {
            if (schedule.getTeacher() == null || schedule.getRoom() == null
                    || schedule.getTimeslot() == null || schedule.getTimeslot2() == null) {
                continue; // CONFLICTED placeholder — skip audit
            }
            List<ConflictResult> conflicts = checkPreAssignmentExcluding(
                    schedule.getId(),
                    schedule.getTeacher().getId(),
                    schedule.getRoom().getId(),
                    schedule.getSection() != null
                    ? schedule.getSection().getId()
                    : null,
                    schedule.getTimeslot().getId(),
                    schedule.getTimeslot2().getId(),
                    semester,
                    schoolYear,
                    schedule);

            for (ConflictResult result : conflicts) {
                // Only log if not already logged for this schedule + type
                boolean alreadyLogged = conflictLogRepository
                        .findByScheduleIdAndResolvedFalse(schedule.getId())
                        .stream()
                        .anyMatch(cl -> cl.getConflictType() == result.type());

                if (!alreadyLogged) {
                    conflictLogService.log(schedule, result.type(),
                            result.description());
                    conflictCount++;
                    log.warn("Audit conflict [{}]: schedule {} — {}",
                            result.type(), schedule.getId(),
                            result.description());
                }
            }
        }

        log.info("Audit complete. New conflicts found: {}", conflictCount);
        return conflictCount;
    }

    // ── Result record ──────────────────────────────────────────────────────────
    /**
     * Represents a single detected conflict.
     *
     * @param type the conflict category
     * @param description human-readable explanation for the admin
     * @param isHard true = blocks scheduling; false = soft advisory warning
     */
    public record ConflictResult(ConflictType type,
            String description,
            boolean isHard) {

        /**
         * Returns true if this result should prevent the schedule from saving.
         */
        public boolean isBlocking() {
            return isHard;
        }
    }
}
