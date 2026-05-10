package com.timecraft.timecraft.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.dto.request.ScheduleGenerateRequest;
import com.timecraft.timecraft.model.Campus;
import com.timecraft.timecraft.model.ConflictLog.ConflictType;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Room;
import com.timecraft.timecraft.model.Room.RoomType;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.Schedule.ScheduleStatus;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.model.SectionConfig;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.model.TeacherAvailability;
import com.timecraft.timecraft.model.TeacherProfile;
import com.timecraft.timecraft.model.Timeslot;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.CourseSubjectRepository;
import com.timecraft.timecraft.repository.RoomRepository;
import com.timecraft.timecraft.repository.ScheduleRepository;
import com.timecraft.timecraft.repository.SectionConfigRepository;
import com.timecraft.timecraft.repository.SectionRepository;
import com.timecraft.timecraft.repository.StudentChecklistRepository;
import com.timecraft.timecraft.repository.SubjectAssignmentRepository;
import com.timecraft.timecraft.repository.TeacherAvailabilityRepository;
import com.timecraft.timecraft.repository.TeacherProfileRepository;
import com.timecraft.timecraft.repository.TeacherSubjectPreferenceRepository;
import com.timecraft.timecraft.repository.TimeslotRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Core scheduling engine for TimeCraft.
 *
 * Generation strategy — constraint satisfaction with greedy backtracking: 1.
 * Sort sections by most-constrained first (health courses, large sections) 2.
 * For each section, fetch its curriculum subjects for the term 3. For each
 * subject, find a valid (teacher, room, timeslot pair) combination 4. Apply all
 * conflict checks before committing an assignment 5. Log CONFLICTED status when
 * no valid combination is found
 *
 * Teacher rules enforced: - No two classes at the same timeslot (teacher
 * double-booking) - Teacher is free if not already assigned at that timeslot
 * (no availability table) - GE teachers can use rooms on either campus
 * (campus_flexible = true) - Dept teachers are locked to their college's campus
 * - No year-level restriction — teachers can span Year 1 to Year 4
 *
 * Room rules enforced: - Room type must match subject session type (LECTURE vs
 * LABORATORY) - Health courses use Campus of Health and Sciences (CHS) -
 * CCSE/Business/Psychology use Campus of Learning Innovation (CLI) - GE
 * teachers: preferred campus first, other campus as fallback
 *
 * Section rules enforced: - No two subjects in the same section at the same
 * timeslot - Both session days (ts1, ts2) must be on different days of the week
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
    private final StudentChecklistRepository studentChecklistRepository;
    private final ConflictLogService conflictLogService;
    private final OllamaScheduleAdvisorService ollamaAdvisor;
    private final SubjectAssignmentRepository subjectAssignmentRepository;
    private final TeacherAvailabilityRepository teacherAvailabilityRepository;
    private final SectionConfigRepository sectionConfigRepository;
    private final CourseRepository courseRepository;
    private final TeacherSubjectPreferenceRepository teacherSubjectPreferenceRepository;

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
    public List<Schedule> generateForTerm(ScheduleGenerateRequest request) {
        Semester semester = request.getSemester();
        String schoolYear = request.getSchoolYear();
        log.info("Starting schedule generation for {} {}", semester, schoolYear);

        // Clear previous drafts and conflict logs for this term
        if (request.isClearDraftsFirst()) {
            if (request.getCourseId() != null) {
                clearDraftsForCourse(request.getCourseId(), semester, schoolYear);
            } else {
                clearDrafts(semester, schoolYear);
            }
            conflictLogService.clearAllForTerm(semester, schoolYear);
        }

        // Auto-create sections from SectionConfig if not yet created
        ensureSectionsExist(request.getCourseId(), semester, schoolYear);

        // Fetch all active sections for the term, sorted most-constrained first
        List<Section> sections = sectionRepository
                .findBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(Section::isActive)
                .filter(s -> request.getSectionId() == null
                || s.getId().equals(request.getSectionId()))
                .filter(s -> request.getCourseId() == null
                || s.getCourse().getId().equals(request.getCourseId()))
                .sorted(Comparator
                        .comparingInt((Section s) -> isHealthSection(s) ? 0 : 1)
                        .thenComparingInt((Section s) -> s.getCourse().getCode().equals("BSIT") ? 0 : 1)
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
        // Track teacher assigned per subject to reuse for LAB session
        java.util.Map<Long, User> subjectTeacherCache = new java.util.HashMap<>();

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

            if (cs.isShared()) {
                // Find existing DRAFT schedule for this subject at this year level
                Optional<Schedule> existing = scheduleRepository
                        .findBySubjectIdAndSemesterAndSchoolYear(
                                subject.getId(), semester, schoolYear)
                        .stream()
                        .filter(s -> s.getStatus() == ScheduleStatus.DRAFT)
                        .filter(s -> s.getSection() != null
                                && s.getSection().getYearLevel() == section.getYearLevel())
                        .findFirst();

                if (existing.isPresent()) {
                    // Clone the existing schedule entry pointing to THIS section
                    Schedule original = existing.get();
                    Schedule clone = Schedule.builder()
                            .subject(original.getSubject())
                            .room(original.getRoom())
                            .teacher(original.getTeacher())
                            .timeslot(original.getTimeslot())
                            .timeslot2(original.getTimeslot2())
                            .section(section)
                            .semester(semester)
                            .schoolYear(schoolYear)
                            .campus(original.getCampus())
                            .sessionType(original.getSessionType())
                            .status(ScheduleStatus.DRAFT)
                            .build();
                    result.add(scheduleRepository.save(clone));
                    log.debug("Shared subject {} cloned to section {}",
                            subject.getCode(), section.getDisplayLabel());
                    continue;
                }
            }

            boolean isMajor = subject.getSubjectType() == Subject.SubjectType.MAJOR;

            if (isMajor && subject.isHasLab()) {
                Schedule lec = tryScheduleSubject(subject, section, campus,
                        semester, schoolYear, Subject.SessionType.LECTURE,
                        subjectTeacherCache);
                result.add(lec);
                if (lec.getTeacher() != null) {
                    subjectTeacherCache.put(subject.getId(), lec.getTeacher());
                }
                Schedule lab = tryScheduleSubject(subject, section, campus,
                        semester, schoolYear, Subject.SessionType.LABORATORY,
                        subjectTeacherCache);
                result.add(lab);
            } else if (isMajor) {
                Schedule lec = tryScheduleSubject(subject, section, campus,
                        semester, schoolYear, Subject.SessionType.LECTURE,
                        subjectTeacherCache);
                result.add(lec);
            } else {
                Schedule schedule = tryScheduleSubject(subject, section, campus,
                        semester, schoolYear, subject.getSessionType(),
                        subjectTeacherCache);
                result.add(schedule);
            }
        }

        return result;
    }

    // ── Subject assignment attempt ─────────────────────────────────────────────
    private Schedule tryScheduleSubject(Subject subject, Section section,
            Campus campus, Semester semester,
            String schoolYear, Subject.SessionType overrideSessionType) {
        return tryScheduleSubject(subject, section, campus, semester, schoolYear,
                overrideSessionType, new java.util.HashMap<>());
    }

    private Schedule tryScheduleSubject(Subject subject, Section section,
            Campus campus, Semester semester,
            String schoolYear, Subject.SessionType overrideSessionType,
            java.util.Map<Long, User> subjectTeacherCache) {
        // Reuse cached teacher for LAB session of same subject
        User teacher = subjectTeacherCache.containsKey(subject.getId())
                ? subjectTeacherCache.get(subject.getId())
                : resolveTeacher(subject, section, semester, schoolYear);

        if (teacher == null) {
            return logAndSaveConflict(null, subject, section, campus,
                    semester, schoolYear,
                    ConflictType.TEACHER_UNAVAILABLE,
                    "No teacher assigned to subject: " + subject.getCode());
        }

        // Validate teacher department matches subject department
        TeacherProfile profile = teacherProfileRepository
                .findByUserId(teacher.getId()).orElse(null);

        if (profile != null
                && !profile.isGETeacher()
                && !profile.isCrossDepartment()
                && subject.getDepartment() != null
                && !profile.getDepartment().getId()
                        .equals(subject.getDepartment().getId())) {
            return logAndSaveConflict(null, subject, section, campus,
                    semester, schoolYear,
                    ConflictType.WRONG_DEPARTMENT,
                    String.format("Teacher %s belongs to dept %s but subject %s "
                            + "belongs to dept %s",
                            teacher.getFullName(),
                            profile.getDepartment().getCode(),
                            subject.getCode(),
                            subject.getDepartment().getCode()));
        }

        // Validate room type matches the session being scheduled
        RoomType requiredRoomType = overrideSessionType == Subject.SessionType.LABORATORY
                ? RoomType.LABORATORY
                : RoomType.LECTURE;

        // Find two free timeslots on different days
        TimeslotPair pair = findTimeslotPair(teacher, section,
                semester, schoolYear, overrideSessionType);

        if (pair == null) {
            return logAndSaveConflict(null, subject, section, campus,
                    semester, schoolYear,
                    ConflictType.TEACHER_DOUBLE_BOOKED,
                    "No available timeslot pair found for teacher: "
                    + teacher.getFullName() + " for subject: " + subject.getCode());
        }

        // Find an available room — use actual subject group size not section max
        int roomCapacity = overrideSessionType == Subject.SessionType.LABORATORY
                ? 30  // lab sessions split the class; use lab room capacity
                : section.getMaxStudents();
        Room room = findRoom(profile, campus, requiredRoomType,
                roomCapacity, pair.ts1().getId(),
                semester, schoolYear);

        if (room == null) {
            return logAndSaveConflict(null, subject, section, campus,
                    semester, schoolYear,
                    ConflictType.ROOM_DOUBLE_BOOKED,
                    "No available " + requiredRoomType
                    + " room with capacity >= " + section.getMaxStudents());
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
                .sessionType(overrideSessionType)
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
     * Finds two timeslots on different days where: - The teacher is available
     * and not already scheduled - The section does not already have a class at
     * that time
     */
    private TimeslotPair findTimeslotPair(User teacher, Section section,
            Semester semester, String schoolYear,
            Subject.SessionType sessionType) {
        // Only hasLab LECTURE uses 60-min slots; all others use 90-min
        List<Timeslot> allSlots = timeslotRepository
                .findAllByOrderByDayOfWeekAscSlotNumberAsc();

        List<Timeslot> freeSlots = allSlots.stream()
                .filter(ts -> isTeacherAvailableAtSlot(teacher, ts))
                .filter(ts -> isSlotFreeForTeacher(teacher, ts, semester, schoolYear))
                .filter(ts -> isSlotFreeForSection(section, ts, semester, schoolYear))
                .toList();

        // Count how many classes the section already has per day
        java.util.Map<Object, Long> dayLoad = new java.util.HashMap<>();
        java.util.Map<Object, java.util.Set<Short>> daySlots = new java.util.HashMap<>();

        scheduleRepository.findSectionSchedules(section.getId(), semester, schoolYear)
                .forEach(s -> {
                    if (s.getTimeslot() != null) {
                        dayLoad.merge(s.getTimeslot().getDayOfWeek(), 1L, Long::sum);
                        daySlots.computeIfAbsent(s.getTimeslot().getDayOfWeek(),
                                k -> new java.util.HashSet<>())
                                .add(s.getTimeslot().getSlotNumber());
                    }
                    if (s.getTimeslot2() != null) {
                        dayLoad.merge(s.getTimeslot2().getDayOfWeek(), 1L, Long::sum);
                        daySlots.computeIfAbsent(s.getTimeslot2().getDayOfWeek(),
                                k -> new java.util.HashSet<>())
                                .add(s.getTimeslot2().getSlotNumber());
                    }
                });

        // Sort free slots by least-loaded day first to spread across the week
        List<Timeslot> spread = freeSlots.stream()
                .sorted(Comparator.comparingLong(
                        ts -> dayLoad.getOrDefault(ts.getDayOfWeek(), 0L)))
                .toList();

        // Find two slots on different days
        for (int i = 0; i < spread.size(); i++) {
            for (int j = i + 1; j < spread.size(); j++) {
                Timeslot ts1 = spread.get(i);
                Timeslot ts2 = spread.get(j);
                if (ts1.getDayOfWeek().equals(ts2.getDayOfWeek())) {
                    continue;
                }
                return new TimeslotPair(ts1, ts2);
            }
        }
        log.warn("No timeslot pair found. Free slots available: {}", spread.size());
        return null;
    }

    // ── Room finder ───────────────────────────────────────────────────────────
    private Room findRoom(TeacherProfile profile, Campus defaultCampus,
            RoomType roomType, int minCapacity,
            Long timeslotId, Semester semester, String schoolYear) {
        if (profile != null && profile.isGETeacher()) {
            Long preferredId = profile.getPreferredCampus() != null
                    ? profile.getPreferredCampus().getId()
                    : defaultCampus.getId();

            List<Room> rooms = roomRepository.findAvailableRoomsFlexible(
                    roomType, minCapacity, timeslotId,
                    semester, schoolYear, preferredId);
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

private boolean isAlreadyScheduledForYearLevel(Subject subject, Semester semester,
            String schoolYear, short yearLevel) {
        return scheduleRepository.findBySubjectIdAndSemesterAndSchoolYear(
                subject.getId(), semester, schoolYear)
                .stream()
                .filter(s -> s.getStatus() == ScheduleStatus.DRAFT)
                .anyMatch(s -> s.getSection() != null
                        && s.getSection().getYearLevel() == yearLevel);
    }
    // Add this field injection above ^^, then replace the method:
    private User resolveTeacher(Subject subject, Section section,
            Semester semester, String schoolYear) {
        // First: honour Program Head's finalized assignment (section-specific)
        Optional<User> assigned = subjectAssignmentRepository
                .findBySubjectIdAndSectionIdAndSemesterAndSchoolYearAndIsFinalizedTrue(
                        subject.getId(), section.getId(),
                        semester.name(), schoolYear)
                .map(SubjectAssignment::getTeacher)
                .filter(u -> u != null && u.isActive());
        if (assigned.isPresent()) {
            return assigned.get();
        }

        // Fallback: any finalized assignment for this subject in the term
        // (section-agnostic)
        // Fallback: any finalized assignment for this subject in the term
        // (section-agnostic)
        Optional<User> assignedAny = subjectAssignmentRepository
                .findBySemesterAndSchoolYearAndIsFinalizedTrue(
                        semester.name(), schoolYear)
                .stream()
                .filter(a -> a.getSubject().getId().equals(subject.getId()))
                .filter(a -> a.getTeacher() != null && a.getTeacher().isActive())
                .map(SubjectAssignment::getTeacher)
                .findFirst();
        if (assignedAny.isPresent()) {
            return assignedAny.get();
        }

        // Fallback: non-finalized assignment for this subject (any section) — still
        // honor PH's choice
        Optional<User> assignedDraft = subjectAssignmentRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        List.of(subject.getId()), semester.name(), schoolYear)
                .stream()
                .filter(a -> a.getTeacher() != null && a.getTeacher().isActive())
                .map(SubjectAssignment::getTeacher)
                .findFirst();
        if (assignedDraft.isPresent()) {
            return assignedDraft.get();
        }

        // Fallback: check if subject is GE (MINOR type)
        boolean isGE = subject.getSubjectType() == Subject.SubjectType.MINOR;

        if (isGE) {
            // GE: find teacher with preference AND still has free timeslots
            // Sort by: has preference first, then least load
            // Filter out teachers who are fully booked (no free slots left)
            return teacherProfileRepository.findAll().stream()
                    .filter(TeacherProfile::isGETeacher)
                    .map(TeacherProfile::getUser)
                    .filter(u -> u != null && u.isActive())
                    .filter(u -> hasAvailableTimeslotPair(u, section, semester, schoolYear))
                    .sorted(Comparator
                        .comparingInt((User u) -> teacherSubjectPreferenceRepository
                        .findByTeacherIdAndSubjectIdAndSemesterAndSchoolYear(
                                u.getId(), subject.getId(),
                                semester, schoolYear)
                        .isPresent() ? 0 : 1)
                        .thenComparingLong(u -> scheduleRepository
                        .countByTeacherIdAndStatus(u.getId(),
                                ScheduleStatus.DRAFT)))
                .findFirst()
                .orElse(null);
        }
        // Major: least-loaded available teacher in subject's department
        if (subject.getDepartment() == null) {
            return null;
        }
        if (subject.getDepartment() == null) {
            return null;
        }
// Get teachers already scheduled for this subject in other sections this term
        List<Long> alreadyTeachingThisSubject = scheduleRepository
                .findBySubjectIdAndSemesterAndSchoolYear(subject.getId(), semester, schoolYear)
                .stream()
                .filter(s -> s.getStatus() == ScheduleStatus.DRAFT)
                .filter(s -> s.getTeacher() != null)
                .map(s -> s.getTeacher().getId())
                .distinct()
                .toList();

        // Prefer teachers NOT already teaching this subject (spread the load)
        // Fall back to any available teacher if no fresh one exists
        List<User> departmentTeachers = teacherProfileRepository
                .findByDepartmentId(subject.getDepartment().getId())
                .stream()
                .map(TeacherProfile::getUser)
                .filter(u -> u != null && u.isActive())
                .filter(u -> hasAvailableTimeslotPair(u, section, semester, schoolYear))
                .toList();

        log.debug("Department teachers for {}: {} total, {} with available slots",
                subject.getCode(), 
                teacherProfileRepository.findByDepartmentId(subject.getDepartment().getId()).size(),
                departmentTeachers.size());
        return departmentTeachers.stream()
                .filter(u -> !alreadyTeachingThisSubject.contains(u.getId()))
                .min(Comparator.comparingLong(
                        u -> scheduleRepository.countByTeacherIdAndStatus(
                                u.getId(), ScheduleStatus.DRAFT)))
                .or(() -> departmentTeachers.stream()
                        .min(Comparator.comparingLong(
                                u -> scheduleRepository.countByTeacherIdAndStatus(
                                        u.getId(), ScheduleStatus.DRAFT))))
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
        List<Schedule> toDelete = scheduleRepository
                .findBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(s -> s.getStatus() == ScheduleStatus.DRAFT
                || s.getStatus() == ScheduleStatus.CONFLICTED)
                .toList();
        scheduleRepository.deleteAll(toDelete);
        log.info("Cleared {} existing DRAFT/CONFLICTED entries", toDelete.size());
    }

    private void clearDraftsForCourse(Long courseId, Semester semester, String schoolYear) {
        List<Schedule> toDelete = scheduleRepository
                .findBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(s -> s.getSection() != null
                && s.getSection().getCourse().getId().equals(courseId))
                .filter(s -> s.getStatus() == ScheduleStatus.DRAFT
                || s.getStatus() == ScheduleStatus.CONFLICTED)
                .toList();
        scheduleRepository.deleteAll(toDelete);
        log.info("Cleared {} DRAFT/CONFLICTED entries for courseId={}", toDelete.size(), courseId);
    }

    // ── Inner record for timeslot pair ────────────────────────────────────────
    private record TimeslotPair(Timeslot ts1, Timeslot ts2) {

    }

    private void ensureSectionsExist(Long courseId, Semester semester, String schoolYear) {
        List<SectionConfig> configs = courseId != null
                ? sectionConfigRepository.findByCourseIdAndSemesterAndSchoolYear(
                        courseId, semester.name(), schoolYear)
                : sectionConfigRepository.findBySemesterAndSchoolYear(
                        semester.name(), schoolYear);

        for (SectionConfig config : configs) {
            Course course = courseRepository.findById(config.getCourse().getId())
                    .orElse(null);
            if (course == null) {
                continue;
            }

            for (int i = 0; i < config.getSectionCount(); i++) {
                String name = String.valueOf((char) ('A' + i));
                boolean exists = sectionRepository
                        .existsByCourseIdAndYearLevelAndSectionNameAndSemesterAndSchoolYear(
                                course.getId(), config.getYearLevel(),
                                name, semester, schoolYear);
                if (!exists) {
                    sectionRepository.save(Section.builder()
                            .course(course)
                            .yearLevel(config.getYearLevel())
                            .sectionName(name)
                            .semester(semester)
                            .schoolYear(schoolYear)
                            .maxStudents((short) 45)
                            .build());
                    log.info("Auto-created section {} Y{} {} {}",
                            name, config.getYearLevel(), semester, schoolYear);
                }
            }
        }
    }

    /**
     * Returns true if placing this timeslot on its day would create more than
     * maxConsecutive back-to-back slots with no gap in between.
     */
    private boolean wouldExceedConsecutiveLimit(Timeslot ts,
            java.util.Map<Object, java.util.Set<Short>> daySlots,
            int maxConsecutive) {
        java.util.Set<Short> occupied = daySlots.getOrDefault(
                ts.getDayOfWeek(), java.util.Collections.emptySet());
        short slot = ts.getSlotNumber();
        // Count consecutive run including this new slot
        int run = 1;
        for (short s = (short) (slot - 1); s >= 1 && occupied.contains(s); s--) {
            run++;
        }
        for (short s = (short) (slot + 1); s <= 7 && occupied.contains(s); s++) {
            run++;
        }
        return run > maxConsecutive;
    }

    private boolean isTeacherAvailableAtSlot(User teacher, Timeslot ts) {
        return teacherAvailabilityRepository
                .findByTeacherIdAndTimeslotId(teacher.getId(), ts.getId())
                .map(TeacherAvailability::isAvailable)
                .orElse(true); // absent = no restriction declared = treat as available
    }

    private boolean hasAvailableTimeslotPair(User teacher, Section section,
            Semester semester, String schoolYear) {
        List<Timeslot> allSlots = timeslotRepository
                .findAllByOrderByDayOfWeekAscSlotNumberAsc();

        // Only check teacher's own free slots — not section slots.
        // Section conflicts are checked later in findTimeslotPair.
        List<Timeslot> freeSlots = allSlots.stream()
                .filter(ts -> isTeacherAvailableAtSlot(teacher, ts))
                .filter(ts -> isSlotFreeForTeacher(teacher, ts, semester, schoolYear))
                .toList();

        // Need at least two free slots on different days
        for (int i = 0; i < freeSlots.size(); i++) {
            for (int j = i + 1; j < freeSlots.size(); j++) {
                if (!freeSlots.get(i).getDayOfWeek()
                        .equals(freeSlots.get(j).getDayOfWeek())) {
                    return true;
                }
            }
        }
        return false;
    }
}
