package com.timecraft.timecraft.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.Campus;
import com.timecraft.timecraft.model.ConflictLog.ConflictType;
import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Room;
import com.timecraft.timecraft.model.Room.RoomType;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.Schedule.ScheduleStatus;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.Teacher;
import com.timecraft.timecraft.model.TeacherProfile;
import com.timecraft.timecraft.model.Timeslot;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.CourseSubjectRepository;
import com.timecraft.timecraft.repository.RoomRepository;
import com.timecraft.timecraft.repository.ScheduleRepository;
import com.timecraft.timecraft.repository.SectionRepository;
import com.timecraft.timecraft.repository.StudentChecklistRepository;
import com.timecraft.timecraft.repository.TeacherProfileRepository;
import com.timecraft.timecraft.repository.TeacherRepository;
import com.timecraft.timecraft.repository.TimeslotRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Core scheduling engine for TimeCraft.
 *
 * Generation strategy — constraint satisfaction with greedy backtracking:
 * 1. Sort sections by most-constrained first (health courses, large sections)
 * 2. For each section, fetch its curriculum subjects for the term
 * 3. For each subject, find a valid (teacher, room, timeslot pair) combination
 * 4. Apply all conflict checks before committing an assignment
 * 5. Log CONFLICTED status when no valid combination is found
 *
 * Teacher rules enforced:
 * - No two classes at the same timeslot (teacher double-booking)
 * - Teacher is free if not already assigned at that timeslot (no availability
 * table)
 * - GE teachers can use rooms on either campus (campus_flexible = true)
 * - Dept teachers are locked to their college's campus
 * - No year-level restriction — teachers can span Year 1 to Year 4
 *
 * Room rules enforced:
 * - Room type must match subject session type (LECTURE vs LABORATORY)
 * - Health courses use Campus of Health and Sciences (CHS)
 * - CCSE/Business/Psychology use Campus of Learning Innovation (CLI)
 * - GE teachers: preferred campus first, other campus as fallback
 *
 * Section rules enforced:
 * - No two subjects in the same section at the same timeslot
 * - Both session days (ts1, ts2) must be on different days of the week
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulingEngine {

        private final SectionRepository sectionRepository;
        private final CourseSubjectRepository courseSubjectRepository;
        private final ScheduleRepository scheduleRepository;
        private final RoomRepository roomRepository;
        private final TimeslotRepository timeslotRepository;
        private final TeacherProfileRepository teacherProfileRepository;
        private final TeacherRepository teacherRepository;
        private final StudentChecklistRepository studentChecklistRepository;
        private final ConflictLogService conflictLogService;
        private final OllamaScheduleAdvisorService ollamaAdvisor;

        // Max students per section — used to compute how many sections to open
        private static final int MAX_CLASS_SIZE = 40;

        // Campus codes — used to derive campus from department
        private static final String CLI_CODE = "CLI";
        private static final String CHS_CODE = "CHS";

        // Health department codes that must use CHS campus
        private static final List<String> HEALTH_DEPT_CODES = List.of(
                        "CON", "CORT", "CMLS", "COP", "CORT2", "COPT");

        // ── Main entry point ──────────────────────────────────────────────────────

        /**
         * Generates a complete timetable for all active sections in a given term.
         * Clears existing DRAFT entries and conflict logs before regenerating.
         * Sections with unresolvable conflicts are marked CONFLICTED, not skipped.
         *
         * @return list of all Schedule entries created (DRAFT + CONFLICTED)
         */
        @Transactional
        public List<Schedule> generateForTerm(Semester semester, String schoolYear) {
                log.info("Starting schedule generation for {} {}", semester, schoolYear);

                // Clear previous drafts and conflict logs for this term
                clearDrafts(semester, schoolYear);
                conflictLogService.clearAllForTerm(semester, schoolYear);

                // Fetch all active sections for the term, sorted most-constrained first
                List<Section> sections = sectionRepository
                                .findBySemesterAndSchoolYear(semester, schoolYear)
                                .stream()
                                .filter(Section::isActive)
                                .sorted(Comparator
                                                .comparingInt((Section s) -> isHealthSection(s) ? 0 : 1)
                                                .thenComparingInt(s -> -s.getMaxStudents()))
                                .toList();

                log.info("Found {} sections to schedule", sections.size());

                List<Schedule> allSchedules = new ArrayList<>();

                for (Section section : sections) {
                        List<Schedule> sectionSchedules = generateForSection(
                                        section, semester, schoolYear);
                        allSchedules.addAll(sectionSchedules);
                }

                log.info("Generation complete. Total entries: {}. Conflicted: {}",
                                allSchedules.size(),
                                allSchedules.stream()
                                                .filter(s -> s.getStatus() == ScheduleStatus.CONFLICTED)
                                                .count());

                // ── Ollama advisory pass (non-blocking) ──────────────────────
                // Runs AFTER the CSP engine and conflict checks are complete.
                // Ollama explains the result and flags soft issues only.
                // Any exception from Ollama must NOT break the schedule result.
                try {
                        List<Schedule> successfulOnly = allSchedules.stream()
                                        .filter(s -> s.getStatus() == ScheduleStatus.DRAFT)
                                        .toList();

                        if (!successfulOnly.isEmpty()) {
                                String summary = ollamaAdvisor.summarizeSchedule(
                                                successfulOnly, semester, schoolYear);
                                log.info("Ollama schedule summary:\n{}", summary);
                        }
                } catch (Exception e) {
                        log.warn("Ollama advisory pass failed (non-critical): {}", e.getMessage());
                }

                return allSchedules;
        }

        // ── Section-level generation ───────────────────────────────────────────────

        private List<Schedule> generateForSection(Section section,
                        Semester semester,
                        String schoolYear) {
                List<Schedule> result = new ArrayList<>();

                // Get all subjects for this section's course at its year level and semester
                List<CourseSubject> curriculum = courseSubjectRepository
                                .findByCourseIdAndYearLevelAndSemester(
                                                section.getCourse().getId(),
                                                section.getYearLevel(),
                                                semester);

                log.debug("Section {} | {} subjects to schedule",
                                section.getDisplayLabel(), curriculum.size());

                // Determine campus for this section
                Campus campus = resolveCampus(section);

                for (CourseSubject cs : curriculum) {
                        Subject subject = cs.getSubject();

                        // Skip shared subjects if already scheduled for another section
                        // that shares it — students will be enrolled across sections
                        if (cs.isShared() && isAlreadyScheduled(subject, semester, schoolYear)) {
                                log.debug("Subject {} is shared and already scheduled — skipping",
                                                subject.getCode());
                                continue;
                        }

                        Schedule schedule = tryScheduleSubject(
                                        subject, section, campus, semester, schoolYear);
                        result.add(schedule);
                }

                return result;
        }

        // ── Subject assignment attempt ─────────────────────────────────────────────

        private Schedule tryScheduleSubject(Subject subject, Section section,
                        Campus campus, Semester semester,
                        String schoolYear) {
                User teacher = subject.getDepartment() != null
                                ? resolveTeacher(subject)
                                : null;

                if (teacher == null) {
                        return logAndSaveConflict(null, subject, section, campus,
                                        semester, schoolYear,
                                        ConflictType.TEACHER_UNAVAILABLE,
                                        "No teacher assigned to subject: " + subject.getCode());
                }

                // Validate teacher department matches subject department
                TeacherProfile profile = teacherProfileRepository
                                .findByUserId(teacher.getId()).orElse(null);

                if (profile != null &&
                                !profile.isGETeacher() &&
                                !profile.getDepartment().getId()
                                                .equals(subject.getDepartment().getId())) {
                        return logAndSaveConflict(null, subject, section, campus,
                                        semester, schoolYear,
                                        ConflictType.WRONG_DEPARTMENT,
                                        String.format("Teacher %s belongs to dept %s but subject %s " +
                                                        "belongs to dept %s",
                                                        teacher.getFullName(),
                                                        profile.getDepartment().getCode(),
                                                        subject.getCode(),
                                                        subject.getDepartment().getCode()));
                }

                // Validate room type matches subject session type
                RoomType requiredRoomType = subject.getSessionType() == Subject.SessionType.LABORATORY
                                ? RoomType.LABORATORY
                                : RoomType.LECTURE;

                // Find two free timeslots on different days
                TimeslotPair pair = findTimeslotPair(teacher, section,
                                semester, schoolYear);

                if (pair == null) {
                        return logAndSaveConflict(null, subject, section, campus,
                                        semester, schoolYear,
                                        ConflictType.TEACHER_DOUBLE_BOOKED,
                                        "No available timeslot pair found for teacher: " +
                                                        teacher.getFullName() + " for subject: " + subject.getCode());
                }

                // Find an available room
                Room room = findRoom(profile, campus, requiredRoomType,
                                section.getMaxStudents(), pair.ts1().getId(),
                                semester.getLabel(), schoolYear);

                if (room == null) {
                        return logAndSaveConflict(null, subject, section, campus,
                                        semester, schoolYear,
                                        ConflictType.ROOM_DOUBLE_BOOKED,
                                        "No available " + requiredRoomType +
                                                        " room with capacity >= " + section.getMaxStudents());
                }

                // All checks passed — save the schedule entry
                Schedule schedule = Schedule.builder()
                                .subject(subject)
                                .room(room)
                                .teacher(teacher)
                                .timeslot(pair.ts1())
                                .timeslot2(pair.ts2())
                                .section(section)
                                .semester(semester)
                                .schoolYear(schoolYear)
                                .campus(room.getCampus())
                                .status(ScheduleStatus.DRAFT)
                                .build();

                Schedule saved = scheduleRepository.save(schedule);
                log.debug("Scheduled {} | {} | {} + {}",
                                subject.getCode(), section.getDisplayLabel(),
                                pair.ts1().getLabel(), pair.ts2().getLabel());
                return saved;
        }

        // ── Timeslot pair finder ───────────────────────────────────────────────────

        /**
         * Finds two timeslots on different days where:
         * - The teacher is available and not already scheduled
         * - The section does not already have a class at that time
         */
        private TimeslotPair findTimeslotPair(User teacher, Section section,
                        Semester semester,
                        String schoolYear) {
                List<Timeslot> allSlots = timeslotRepository
                                .findAllByOrderByDayOfWeekAscSlotNumberAsc();

                List<Timeslot> freeSlots = allSlots.stream()
                                .filter(ts -> isSlotFreeForTeacher(teacher, ts,
                                                semester, schoolYear))
                                .filter(ts -> isSlotFreeForSection(section, ts,
                                                semester, schoolYear))
                                .toList();

                // Find two slots on different days
                for (int i = 0; i < freeSlots.size(); i++) {
                        for (int j = i + 1; j < freeSlots.size(); j++) {
                                Timeslot ts1 = freeSlots.get(i);
                                Timeslot ts2 = freeSlots.get(j);
                                if (ts1.getDayOfWeek() != ts2.getDayOfWeek()) {
                                        return new TimeslotPair(ts1, ts2);
                                }
                        }
                }
                return null;
        }

        // ── Room finder ───────────────────────────────────────────────────────────

        private Room findRoom(TeacherProfile profile, Campus defaultCampus,
                        RoomType roomType, int minCapacity,
                        Long timeslotId, String semester, String schoolYear) {
                if (profile != null && profile.isGETeacher()) {
                        // GE teacher: search both campuses, preferred campus first
                        Long preferredId = profile.getPreferredCampus() != null
                                        ? profile.getPreferredCampus().getId()
                                        : defaultCampus.getId();

                        List<Room> rooms = roomRepository.findAvailableRoomsFlexible(
                                        roomType, minCapacity, timeslotId, semester, schoolYear,
                                        preferredId);
                        return rooms.isEmpty() ? null : rooms.get(0);
                }

                // Dept teacher: locked to section's campus
                List<Room> rooms = roomRepository.findAvailableRooms(
                                defaultCampus.getId(), roomType, minCapacity,
                                timeslotId, semester, schoolYear);
                return rooms.isEmpty() ? null : rooms.get(0);
        }

        // ── Campus resolver ───────────────────────────────────────────────────────

        private Campus resolveCampus(Section section) {
                String deptCode = section.getCourse().getDepartment().getCode();
                boolean isHealth = HEALTH_DEPT_CODES.contains(deptCode);
                String campusCode = isHealth ? CHS_CODE : CLI_CODE;

                return roomRepository.findAll()
                                .stream()
                                .map(Room::getCampus)
                                .filter(c -> c.getCode().equals(campusCode))
                                .findFirst()
                                .orElseThrow(() -> new IllegalStateException(
                                                "Campus not found for code: " + campusCode));
        }

        // ── Helper checks ─────────────────────────────────────────────────────────

        private boolean isSlotFreeForTeacher(User teacher, Timeslot ts,
                        Semester semester, String schoolYear) {
                return scheduleRepository.findTeacherConflicts(
                                teacher.getId(), ts.getId(), semester, schoolYear).isEmpty();
        }

        private boolean isSlotFreeForSection(Section section, Timeslot ts,
                        Semester semester, String schoolYear) {
                return scheduleRepository.findSectionConflicts(
                                section.getId(), ts.getId(), semester, schoolYear).isEmpty();
        }

        private boolean isHealthSection(Section section) {
                return HEALTH_DEPT_CODES.contains(
                                section.getCourse().getDepartment().getCode());
        }

        private boolean isAlreadyScheduled(Subject subject, Semester semester,
                        String schoolYear) {
                return !scheduleRepository.findBySubjectIdAndSemesterAndSchoolYear(
                                subject.getId(), semester, schoolYear).isEmpty();
        }

        private User resolveTeacher(Subject subject) {
                // Find any active teacher belonging to the subject's department.
                // Pick the one with the fewest scheduled classes this term to
                // distribute load evenly — falls back to null if department has
                // no active teachers, which the caller logs as TEACHER_UNAVAILABLE.
                return teacherRepository
                                .findActiveByDepartmentId(subject.getDepartment().getId())
                                .stream()
                                .map(Teacher::getId)
                                .map(id -> teacherProfileRepository.findByUserId(id).orElse(null))
                                .filter(p -> p != null)
                                .map(p -> p.getUser())
                                .min(Comparator.comparingLong(u -> scheduleRepository.countByTeacherIdAndStatus(
                                                u.getId(),
                                                com.timecraft.timecraft.model.Schedule.ScheduleStatus.DRAFT)))
                                .orElse(null);
        }

        // ── Conflict save helper ───────────────────────────────────────────────────

        private Schedule logAndSaveConflict(Schedule existing, Subject subject,
                        Section section, Campus campus,
                        Semester semester, String schoolYear,
                        ConflictType type, String description) {
                log.warn("CONFLICT [{}] Section={} Subject={} — {}",
                                type, section.getDisplayLabel(), subject.getCode(), description);

                Schedule conflict = existing != null ? existing
                                : Schedule.builder()
                                                .subject(subject)
                                                .section(section)
                                                .semester(semester)
                                                .schoolYear(schoolYear)
                                                .campus(campus)
                                                .status(ScheduleStatus.CONFLICTED)
                                                .build();

                Schedule saved = scheduleRepository.save(conflict);
                conflictLogService.log(saved, type, description);
                return saved;
        }

        // ── Draft cleanup ─────────────────────────────────────────────────────────

        private void clearDrafts(Semester semester, String schoolYear) {
                List<Schedule> drafts = scheduleRepository
                                .findBySemesterAndSchoolYearAndStatus(
                                                semester, schoolYear, ScheduleStatus.DRAFT);
                scheduleRepository.deleteAll(drafts);
                log.info("Cleared {} existing DRAFT entries", drafts.size());
        }

        // ── Inner record for timeslot pair ────────────────────────────────────────

        private record TimeslotPair(Timeslot ts1, Timeslot ts2) {
        }
}