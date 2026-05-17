package com.timecraft.timecraft.service;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.dto.request.ScheduleGenerateRequest;
import com.timecraft.timecraft.model.Campus;
import com.timecraft.timecraft.model.ConflictLog;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.MergedSection;
import com.timecraft.timecraft.model.Room;
import com.timecraft.timecraft.model.Room.RoomType;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.Schedule.ScheduleStatus;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.model.SectionConfig;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.Subject.SessionType;
import com.timecraft.timecraft.model.Subject.SubjectType;
import com.timecraft.timecraft.model.SubjectAssignment;
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
 * SchedulingEngine — Conflict-Free CSP Timetable Generator
 *
 * Architecture: ───────────── 1. Load all data into memory at generation start
 * (teachers, rooms, timeslots, sections, assignments). Zero DB queries during
 * assignment hot-loop. 2. Maintain three in-memory lock tables: teacherLocks :
 * teacherId → Set<timeslotId>
 * roomLocks : roomId → Set<timeslotId>
 * sectionLocks : sectionId → Set<timeslotId>
 * These are checked atomically before any assignment is committed. 3. For each
 * subject, iterate all valid (timeslot-pair × room × teacher) combinations. The
 * first combination that passes ALL lock checks is taken. No "force online"
 * fallback — online is only applied per the actual rules. 4. After an
 * assignment is committed the three lock tables are updated in memory. The
 * schedule row is saved to DB only once, at the end of each section. This keeps
 * the DB write path minimal.
 *
 * Scheduling Rules enforced: ────────────────────────── R1. Major lecture-only
 * : 90 min × 2 different days R2. Major with lab LECTURE : 60 min × 2 different
 * days Major with lab LAB : 90 min × 2 different days (never Saturday) R3.
 * Minor (GE) subjects : 90 min × 2 different days rooms 401–408 only Saturday
 * slot → fully online (no room either session) weekday fallback → also online
 * if no 401–408 free R4. No consecutive classes after 2 on the same day (soft,
 * relaxed last) R5. No section double-booking R6. No teacher double-booking R7.
 * No room double-booking R8. LAB sessions never on Saturday R9. Saturday major
 * lecture → ts1=Saturday(online,no room), ts2=weekday(room) R10. Saturday minor
 * → fully online (no room either session) R11. BSCS+BSIT shared subjects → one
 * schedule row, BSIT linked via MergedSection R12. Room 301–304 = computer labs
 * (LAB only) Room 305 = hardware lab (CPE LAB only) Room 306 = lecture room
 * (major LECTURE only, not minor) Rooms 401–408 = minor/GE rooms (minor only)
 */
@Slf4j

@Service
@RequiredArgsConstructor
public class SchedulingEngine {

    // ── Repositories ──────────────────────────────────────────────────────────
    private final SectionRepository sectionRepository;
    private final CourseSubjectRepository courseSubjectRepository;
    private final ScheduleRepository scheduleRepository;
    private final RoomRepository roomRepository;
    private final TimeslotRepository timeslotRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final StudentChecklistRepository studentChecklistRepository;
    private final ConflictLogService conflictLogService;
    private final SubjectAssignmentRepository subjectAssignmentRepository;
    private final TeacherAvailabilityRepository teacherAvailabilityRepository;
    private final SectionConfigRepository sectionConfigRepository;
    private final CourseRepository courseRepository;
    private final TeacherSubjectPreferenceRepository teacherSubjectPreferenceRepository;
    private final com.timecraft.timecraft.repository.MergedSectionRepository mergedSectionRepository;

    // ── Constants ─────────────────────────────────────────────────────────────
    private static final String CLI_CODE = "CLI";
    private static final String CHS_CODE = "CHS";
    private static final List<String> HEALTH_DEPT_CODES
            = List.of("CON", "CORT", "CMLS", "COP", "CORT2", "COPT");

    private static final String ROOM_305_NUMBER = "305";
    private static final String ROOM_306_NUMBER = "306";
    private static final Set<String> MINOR_ROOM_NUMBERS
            = Set.of("401", "402", "403", "404", "405", "406", "407", "408");
    private static final Set<String> COMPUTER_LAB_NUMBERS
            = Set.of("301", "302", "303", "304");

    // ── Per-run in-memory state (reset each generateForTerm call) ─────────────
    /**
     * teacherId → Set of locked timeslot IDs (teacher is busy at these)
     */
    private final Map<Long, Set<Long>> teacherLocks = new HashMap<>();
    /**
     * roomId → Set of locked timeslot IDs
     */
    private final Map<Long, Set<Long>> roomLocks = new HashMap<>();
    /**
     * sectionId → Set of locked timeslot IDs
     */
    private final Map<Long, Set<Long>> sectionLocks = new HashMap<>();

    /**
     * All timeslots sorted by day then slot number
     */
    private List<Timeslot> allTimeslots;
    /**
     * All active rooms
     */
    private List<Room> allRooms;
    /**
     * All teacher profiles
     */
    private List<TeacherProfile> allProfiles;
    /**
     * teacherId → availability set (timeslot IDs the teacher is blocked from)
     */
    private Map<Long, Set<Long>> teacherUnavailable;
    /**
     * Campus code → Campus entity
     */
    private Map<String, Campus> campusByCode;

    /**
     * subjectId → Set of teacher IDs with finalized assignments (availability
     * ignored)
     */
    private Map<Long, Set<Long>> finalizedTeachersBySubject = new HashMap<>();

    // ═════════════════════════════════════════════════════════════════════════
    // Main entry point
    // ═════════════════════════════════════════════════════════════════════════
    @Transactional
    public List<Schedule> generateForTerm(ScheduleGenerateRequest request) {
        Semester semester = request.getSemester();
        String schoolYear = request.getSchoolYear();
        log.info("═══ Starting schedule generation: {} {} ═══", semester, schoolYear);

        // ── 1. Clear previous drafts ──────────────────────────────────────────
        if (request.isClearDraftsFirst()) {
            if (request.getCourseId() != null) {
                clearDraftsForCourse(request.getCourseId(), semester, schoolYear);
            } else {
                clearDrafts(semester, schoolYear);
            }
            conflictLogService.clearAllForTerm(semester, schoolYear);
        }

        // ── 2. Auto-create sections from SectionConfig ────────────────────────
        ensureSectionsExist(request.getCourseId(), semester, schoolYear);

        // ── 3. Load all reference data into memory ────────────────────────────
        loadReferenceData(semester, schoolYear);

        // ── 4. Load existing schedules into lock tables ───────────────────────
        //    (needed if clearDraftsFirst=false or partial regeneration)
        loadExistingLocks(semester, schoolYear);

        // ── 5. Fetch and sort sections ─────────────────────────────────────────
        List<Section> sections = sectionRepository
                .findBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(Section::isActive)
                .filter(s -> request.getSectionId() == null
                || s.getId().equals(request.getSectionId()))
                .filter(s -> request.getCourseId() == null
                || s.getCourse().getId().equals(request.getCourseId()))
                // Most-constrained first: health courses → BSIT → largest sections
                .sorted(Comparator
                        .comparingInt((Section s) -> isHealthSection(s) ? 0 : 1)
                        .thenComparingInt((Section s) -> switch (s.getCourse().getCode()) {
                    case "BSCS" ->
                        0;   // BSCS first — shared subjects scheduled here
                    case "BSIT" ->
                        1;   // BSIT second — reuses BSCS rows
                    default ->
                        2;
                })
                        .thenComparingInt(s -> -s.getMaxStudents()))
                .toList();

        log.info("Found {} active sections to schedule", sections.size());

        // ── 6. Generate per section ───────────────────────────────────────────
        List<Schedule> allSchedules = new ArrayList<>();
        for (Section section : sections) {
            List<Schedule> generated = generateForSection(section, semester, schoolYear);
            allSchedules.addAll(generated);
        }

        long conflicted = allSchedules.stream()
                .filter(s -> s.getStatus() == ScheduleStatus.CONFLICTED).count();
        log.info("═══ Generation complete. Total={} Conflicted={} ═══",
                allSchedules.size(), conflicted);
        return allSchedules;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Reference data loader
    // ═════════════════════════════════════════════════════════════════════════
    private void loadReferenceData(Semester semester, String schoolYear) {
        // Reset lock tables
        teacherLocks.clear();
        roomLocks.clear();
        sectionLocks.clear();
        teacherDaySlots.clear();
        sectionDaySlots.clear();
        roomDaySlots.clear();

        allTimeslots = timeslotRepository.findAllByOrderByDayOfWeekAscSlotNumberAsc();
        allRooms = roomRepository.findAll().stream()
                .filter(r -> r.isActive())
                .toList();
        allProfiles = teacherProfileRepository.findAll();

        // Pre-build teacher unavailability map
        teacherUnavailable = new HashMap<>();
        teacherAvailabilityRepository.findAll().forEach(ta -> {
            if (!ta.isAvailable()) {
                teacherUnavailable
                        .computeIfAbsent(ta.getTeacher().getId(), k -> new HashSet<>())
                        .add(ta.getTimeslot().getId());
            }
        });

        // Build campus map
        campusByCode = new HashMap<>();
        allRooms.forEach(r -> {
            if (r.getCampus() != null) {
                campusByCode.put(r.getCampus().getCode(), r.getCampus());
            }
        });

        // Pre-load finalized teacher assignments — these bypass availability checks
        finalizedTeachersBySubject = new HashMap<>();
        subjectAssignmentRepository.findAll().stream()
                .filter(SubjectAssignment::isFinalized)
                .filter(a -> a.getTeacher() != null && a.getTeacher().isActive())
                .forEach(a -> finalizedTeachersBySubject
                .computeIfAbsent(a.getSubject().getId(), k -> new HashSet<>())
                .add(a.getTeacher().getId()));

        log.debug("Loaded {} timeslots, {} rooms, {} teacher profiles",
                allTimeslots.size(), allRooms.size(), allProfiles.size());
    }

    private void loadExistingLocks(Semester semester, String schoolYear) {
        scheduleRepository.findBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(s -> s.getStatus() == ScheduleStatus.DRAFT
                || s.getStatus() == ScheduleStatus.PUBLISHED)
                .forEach(s -> {
                    if (s.getTeacher() != null) {
                        lockTeacher(s.getTeacher().getId(), s.getTimeslot(), s.getTimeslot2());
                    }
                    if (s.getRoom() != null) {
                        lockRoom(s.getRoom().getId(), s.getTimeslot(), s.getTimeslot2());
                    }
                    if (s.getSection() != null) {
                        lockSection(s.getSection().getId(), s.getTimeslot(), s.getTimeslot2()); // addToDayLoad inside
                    }
                    if (s.getTeacher() != null) {
                        addToTeacherDayLoad(s.getTeacher().getId(), s.getTimeslot(), s.getTimeslot2());
                    }
                });
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Section-level generation
    // ═════════════════════════════════════════════════════════════════════════
    private List<Schedule> generateForSection(Section section,
            Semester semester, String schoolYear) {

        List<Schedule> result = new ArrayList<>();
        Map<Long, User> subjectTeacherCache = new HashMap<>();

        Campus campus = resolveCampus(section);

        List<CourseSubject> curriculum = courseSubjectRepository
                .findByCourseIdAndYearLevelAndSemester(
                        section.getCourse().getId(),
                        section.getYearLevel(),
                        semester)
                .stream()
                .sorted(Comparator
                        // 1. has-lab subjects first (most constrained — need LAB room + LECTURE + same teacher)
                        .comparingInt((CourseSubject cs) -> cs.getSubject().isHasLab() ? 0 : 1)
                        // 2. shared subjects next (block timeslots for both BSCS and BSIT)
                        .thenComparingInt(cs -> cs.isShared() ? 0 : 1)
                        // 3. MAJOR before MINOR
                        .thenComparingInt(cs -> cs.getSubject().getSubjectType() == SubjectType.MAJOR ? 0 : 1))
                .collect(Collectors.toList());

        log.debug("Section {} | {} subjects", section.getDisplayLabel(), curriculum.size());

        for (CourseSubject cs : curriculum) {
            Subject subject = cs.getSubject();

            // ── BSCS / BSIT shared subject handling ──────────────────────────
            if (cs.isShared()) {
                boolean isBSIT = section.getCourse().getCode().equals("BSIT");
                boolean isBSCS = section.getCourse().getCode().equals("BSCS");

                if (isBSIT) {
                    List<Schedule> existing = scheduleRepository
                            .findBySubjectIdAndSemesterAndSchoolYear(subject.getId(), semester, schoolYear)
                            .stream()
                            .filter(s -> s.getStatus() == ScheduleStatus.DRAFT)
                            .filter(s -> s.getSection() != null && s.getTeacher() != null && s.getTimeslot() != null)
                            .filter(s -> s.getSection().getCourse().getCode().equals("BSCS"))
                            .toList();
                    if (!existing.isEmpty()) {
                        existing.forEach(s -> {
                            lockSection(section.getId(), s.getTimeslot(), s.getTimeslot2()); // addToDayLoad inside
                            if (s.getTeacher() != null) {
                                lockTeacher(s.getTeacher().getId(), s.getTimeslot(), s.getTimeslot2());
                                addToTeacherDayLoad(s.getTeacher().getId(), s.getTimeslot(), s.getTimeslot2());
                            }
                        });
                        log.debug("BSIT {} reusing BSCS shared schedule for {} ({} rows)",
                                section.getDisplayLabel(), subject.getCode(), existing.size());
                        // Do NOT add BSCS schedule rows to BSIT result —
                        // they belong to the BSCS section. BSIT timeslots are
                        // locked above; MergedSection links them in the grid.
                        continue;
                    }
                    log.warn("BSIT {} scheduling shared {} independently — no BSCS row found",
                            section.getDisplayLabel(), subject.getCode());
                    // Fall through to normal scheduling below

                } else if (isBSCS) {
                    List<Schedule> existing = scheduleRepository
                            .findBySubjectIdAndSemesterAndSchoolYear(subject.getId(), semester, schoolYear)
                            .stream()
                            .filter(s -> s.getStatus() == ScheduleStatus.DRAFT)
                            .filter(s -> s.getSection() != null && s.getTeacher() != null && s.getTimeslot() != null)
                            .filter(s -> s.getSection().getCourse().getCode().equals("BSCS"))
                            .filter(s -> !s.getSection().getId().equals(section.getId()))
                            .toList();
                    if (!existing.isEmpty()) {
                        continue;
                    }
                    // Fall through: BSCS schedules this for the first time
                }
                // All other courses: fall through to normal scheduling
            }

            // ── Normal scheduling ─────────────────────────────────────────────
            boolean isMajor = subject.getSubjectType() == SubjectType.MAJOR;

            if (isMajor && subject.isHasLab()) {
                // ── Step 1: Schedule LAB first (90min, scarce lab rooms — most constrained)
                Schedule lab = assign(subject, section, campus, semester, schoolYear,
                        SessionType.LABORATORY, subjectTeacherCache, Set.of());
                boolean labFailed = lab.getStatus() == ScheduleStatus.CONFLICTED;

                // ── Step 2: Build excluded days from LAB
                Set<DayOfWeek> labDays = new HashSet<>();
                if (!labFailed) {
                    if (lab.getTimeslot() != null) {
                        labDays.add(lab.getTimeslot().getDayOfWeek());
                    }
                    if (lab.getTimeslot2() != null) {
                        labDays.add(lab.getTimeslot2().getDayOfWeek());
                    }
                    if (lab.getTeacher() != null) {
                        subjectTeacherCache.put(subject.getId(), lab.getTeacher());
                    }
                    log.debug("LAB days for {} exclusion: {}", subject.getCode(), labDays);
                }

                // ── Step 3: Schedule LECTURE (60min) excluding LAB days
                // The 60-min sorting will now avoid LAB's start time automatically
                Schedule lec = assign(subject, section, campus, semester, schoolYear,
                        SessionType.LECTURE, subjectTeacherCache,
                        labFailed ? Set.of() : labDays);
                boolean lecFailed = lec.getStatus() == ScheduleStatus.CONFLICTED;

                // ── Step 4: If LAB failed but LECTURE succeeded, retry LAB excluding LECTURE days
                if (labFailed && !lecFailed) {
                    log.warn("LAB retry after LEC for {} / {}", subject.getCode(), section.getDisplayLabel());
                    scheduleRepository.deleteById(lab.getId());
                    scheduleRepository.flush();
                    Set<DayOfWeek> lecDays = new HashSet<>();
                    if (lec.getTimeslot() != null) {
                        lecDays.add(lec.getTimeslot().getDayOfWeek());
                    }
                    if (lec.getTimeslot2() != null) {
                        lecDays.add(lec.getTimeslot2().getDayOfWeek());
                    }
                    if (lec.getTeacher() != null) {
                        subjectTeacherCache.put(subject.getId(), lec.getTeacher());
                    }
                    lab = assign(subject, section, campus, semester, schoolYear,
                            SessionType.LABORATORY, subjectTeacherCache, lecDays);
                    labFailed = lab.getStatus() == ScheduleStatus.CONFLICTED;
                }

                // ── Step 5: Evaluate final result
                if (!labFailed && !lecFailed) {
                    // Hard check: LAB and LECTURE must be on different day-pairs (R2)
                    Set<DayOfWeek> finalLabDays = new HashSet<>();
                    Set<DayOfWeek> finalLecDays = new HashSet<>();
                    if (lab.getTimeslot() != null) {
                        finalLabDays.add(lab.getTimeslot().getDayOfWeek());
                    }
                    if (lab.getTimeslot2() != null) {
                        finalLabDays.add(lab.getTimeslot2().getDayOfWeek());
                    }
                    if (lec.getTimeslot() != null) {
                        finalLecDays.add(lec.getTimeslot().getDayOfWeek());
                    }
                    if (lec.getTimeslot2() != null) {
                        finalLecDays.add(lec.getTimeslot2().getDayOfWeek());
                    }
                    Set<DayOfWeek> overlap = new HashSet<>(finalLabDays);
                    overlap.retainAll(finalLecDays);
                    if (!overlap.isEmpty()) {
                        log.error("R2 VIOLATION: {} LAB+LECTURE share days {} — aborting",
                                subject.getCode(), overlap);
                        // These are DRAFT rows (no ConflictLog) — safe to delete
                        scheduleRepository.deleteById(lab.getId());
                        scheduleRepository.deleteById(lec.getId());
                        scheduleRepository.flush();
                        result.add(saveConflict(subject, section, campus, semester, schoolYear,
                                "R2: LAB and LECTURE on same days for: " + subject.getCode()));
                    } else {
                        result.add(lec);
                        result.add(lab);
                    }
                } else {
                    log.warn("Could not schedule LAB+LECTURE for {} / {}", subject.getCode(), section.getDisplayLabel());
                    // Delete all placeholder/orphan rows safely
                    try {
                        scheduleRepository.deleteById(lec.getId());
                    } catch (Exception ignored) {
                    }
                    try {
                        scheduleRepository.deleteById(lab.getId());
                    } catch (Exception ignored) {
                    }
                    scheduleRepository.flush();
                    result.add(saveConflict(subject, section, campus, semester, schoolYear,
                            "No valid LAB+LECTURE combination for: " + subject.getCode()));
                }

            } else if (isMajor) {
                result.add(assign(subject, section, campus, semester, schoolYear,
                        SessionType.LECTURE, subjectTeacherCache, Set.of()));
            } else {
                result.add(assign(subject, section, campus, semester, schoolYear,
                        subject.getSessionType(), subjectTeacherCache, Set.of()));
            }
        }

        // Link BSIT merged sections after scheduling all BSCS subjects
        linkBSITMergedSections(section, semester, schoolYear);

        return result;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Core assignment engine — CSP with exhaustive search + backtracking
    // ═════════════════════════════════════════════════════════════════════════
    private Schedule assign(Subject subject, Section section, Campus campus,
            Semester semester, String schoolYear,
            SessionType sessionType,
            Map<Long, User> teacherCache,
            Set<DayOfWeek> excludeDays) {

        boolean isMinor = subject.getSubjectType() == SubjectType.MINOR;
        boolean isMajorLec = subject.getSubjectType() == SubjectType.MAJOR
                && sessionType == SessionType.LECTURE;
        boolean isLab = sessionType == SessionType.LABORATORY;
        int reqDuration = isLab ? 90 : (subject.isHasLab() ? 60 : 90);
        RoomType reqRoomType = isLab ? RoomType.LABORATORY : RoomType.LECTURE;

        // ── Build ordered candidate list of teachers ──────────────────────────
        List<User> teachers;
        User cached = teacherCache.get(subject.getId());
        if (cached != null) {
            teachers = List.of(cached); // LAB must use same teacher as LECTURE
        } else {
            teachers = buildTeacherCandidates(subject, section, semester, schoolYear);
        }

        if (teachers.isEmpty()) {
            log.error("NO TEACHERS available for {} in section {}",
                    subject.getCode(), section.getDisplayLabel());
            return saveConflict(subject, section, campus, semester, schoolYear,
                    "No teacher available for: " + subject.getCode());
        }

        // ── Build ordered candidate timeslot pairs ────────────────────────────
        //    Weekday pairs first; Saturday-online pairs appended last (rules 9/10)
        // Saturday-online (R9) only applies to lecture-only majors, not has-lab lecture sessions
        Set<DayOfWeek> effectiveExclude = excludeDays;
        if (subject.isHasLab() && !isLab) {
            effectiveExclude = new HashSet<>(excludeDays);
            effectiveExclude.add(DayOfWeek.SATURDAY);
        }
        // Build pairs: consecutive first, then non-consecutive as fallback
        List<TimeslotPair> pairs = new ArrayList<>();
        pairs.addAll(buildTimeslotPairs(reqDuration, isLab, effectiveExclude,
                true, true, section.getId()));
        // Append non-consecutive pairs so the CSP loop has more options
        // without immediately giving up to online
        List<TimeslotPair> nonConsec = buildTimeslotPairs(reqDuration, isLab, effectiveExclude,
                false, true, section.getId());
        nonConsec.removeIf(p -> pairs.stream().anyMatch(
                q -> q.ts1().getId().equals(p.ts1().getId())
                && q.ts2().getId().equals(p.ts2().getId())));
        pairs.addAll(nonConsec);

        // ── CSP search: teacher × pair × room ────────────────────────────────
        for (boolean relaxBreak : new boolean[]{false, false, true}) {
            for (boolean relaxConsec : new boolean[]{false, true, true}) {
                for (User teacher : teachers) {
                    TeacherProfile profile = profileOf(teacher);

                    for (TimeslotPair pair : pairs) {
                        Timeslot ts1 = pair.ts1();
                        Timeslot ts2 = pair.ts2();

                        // ── Hard constraints (never relaxed) ──────────────────
                        // R6: no teacher double-booking
                        if (!isTeacherFree(teacher.getId(), ts1, ts2)) {
                            continue;
                        }
                        // R5: no section double-booking
                        // Saturday ts1 is online — skip section lock check for that slot
                        boolean sat1check = ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                        boolean satOnlineCheck = (isMajorLec || isMinor) && sat1check;
                        if (satOnlineCheck) {
                            if (!isSectionFree(section.getId(), null, ts2)) {
                                continue;
                            }
                        } else {
                            if (!isSectionFree(section.getId(), ts1, ts2)) {
                                continue;
                            }
                        }
                        // Teacher declared unavailable at this slot
                        // Saturday ts1 is online — only check ts2 availability
                        boolean satOnlineAvail = (isMajorLec || isMinor) && ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                        if (satOnlineAvail) {
                            if (!isTeacherAvailableForSubject(teacher.getId(), subject.getId(), null, ts2)) {
                                continue;
                            }
                        } else {
                            if (!isTeacherAvailableForSubject(teacher.getId(), subject.getId(), ts1, ts2)) {
                                continue;
                            }
                        }

                        // ── Soft constraints (relaxed progressively) ──────────
                        // has-lab LECTURE (60 min) is exempt from break rule — it's short enough
                        boolean applyBreakRule = !relaxBreak && !(subject.isHasLab() && !isLab);
                        if (applyBreakRule && isAdjacentAfter2(section.getId(), ts1, semester, schoolYear)) {
                            continue;
                        }
                        if (applyBreakRule && isAdjacentAfter2(section.getId(), ts2, semester, schoolYear)) {
                            continue;
                        }
                        if (!relaxConsec && wouldExceedConsecutive(section.getId(), ts1)) {
                            continue;
                        }
                        if (!relaxConsec && wouldExceedConsecutive(section.getId(), ts2)) {
                            continue;
                        }

                        // ── Find room — per-session online fallback (LECTURE/MINOR only) ───
                        Room room = null;
                        boolean onlineTs1 = false;
                        boolean onlineTs2 = false;

// R9/R10: Saturday ts1 is always online (no room)
                        if ((isMajorLec || isMinor) && ts1.getDayOfWeek() == DayOfWeek.SATURDAY) {
                            onlineTs1 = true;
                            room = findRoomForSingleSlot(profile, campus, reqRoomType,
                                    section.getMaxStudents(), ts2.getId(), isMinor, subject);
                            if (room == null) {
                                continue;
                            }
                        } else if (isLab) {
                            // LAB: must have a room for BOTH sessions — never online
                            room = findRoom(profile, campus, reqRoomType,
                                    section.getMaxStudents(), ts1.getId(), ts2.getId(),
                                    isMinor, subject);
                            if (room == null) {
                                continue;
                            }
                        } else {
                            // LECTURE (both lecture-only and has-lab) and MINOR
                            room = findRoom(profile, campus, reqRoomType,
                                    section.getMaxStudents(), ts1.getId(), ts2.getId(),
                                    isMinor, subject);
                            if (room == null) {
                                Room roomTs1 = findRoomForSingleSlot(profile, campus, reqRoomType,
                                        section.getMaxStudents(), ts1.getId(), isMinor, subject);
                                if (roomTs1 != null) {
                                    room = roomTs1;
                                    onlineTs2 = true;
                                } else {
                                    Room roomTs2 = findRoomForSingleSlot(profile, campus, reqRoomType,
                                            section.getMaxStudents(), ts2.getId(), isMinor, subject);
                                    if (roomTs2 != null) {
                                        room = roomTs2;
                                        onlineTs1 = true;
                                    } else {
                                        onlineTs1 = true;
                                        onlineTs2 = true;
                                    }
                                }
                            }
                        }

                        // ── R7: no room double-booking ─────────────────────────
                        if (room != null) {
                            Timeslot roomCheckTs1 = onlineTs1 ? null : ts1;
                            Timeslot roomCheckTs2 = onlineTs2 ? null : ts2;
                            if (!isRoomFree(room.getId(), roomCheckTs1, roomCheckTs2)) {
                                continue;
                            }
                        }

                        // ── All constraints passed — commit ────────────────────
                        boolean online = onlineTs1 || onlineTs2;
                        lockTeacher(teacher.getId(), ts1, ts2);
                        boolean sat1 = ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                        boolean satOnline = (isMajorLec || isMinor) && sat1;
                        lockSection(section.getId(), ts1, ts2);
                        addToTeacherDayLoad(teacher.getId(), ts1, ts2);
                        if (room != null) {
                            lockRoom(room.getId(), onlineTs1 ? null : ts1, onlineTs2 ? null : ts2);
                        }

                        Campus effectiveCampus = (room != null) ? room.getCampus() : campus;

                        Schedule schedule = Schedule.builder()
                                .subject(subject)
                                .room(room)
                                .teacher(teacher)
                                .timeslot(ts1)
                                .timeslot2(ts2)
                                .section(section)
                                .semester(semester)
                                .schoolYear(schoolYear)
                                .campus(effectiveCampus)
                                .sessionType(sessionType)
                                .isOnline(online)
                                .isOnlineTs1(onlineTs1)
                                .isOnlineTs2(onlineTs2)
                                .status(ScheduleStatus.DRAFT)
                                .build();

                        Schedule saved = scheduleRepository.save(schedule);
                        scheduleRepository.flush();
                        log.debug("✓ {} | {} | {} | {} + {}",
                                subject.getCode(), section.getDisplayLabel(),
                                teacher.getFullName(), ts1.getLabel(), ts2.getLabel());
                        return saved;
                    }
                }
            }
        }

        // ── Absolute last resort: try any teacher ignoring section soft rules ──
        for (User teacher : buildAllTeacherFallback(semester, schoolYear)) {
            TeacherProfile profile = profileOf(teacher);
            for (TimeslotPair pair : pairs) {
                Timeslot ts1 = pair.ts1();
                Timeslot ts2 = pair.ts2();
                if (!isTeacherFree(teacher.getId(), ts1, ts2)) {
                    continue;
                }
                boolean sat1fb = ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                boolean satOnlineFb = (isMajorLec || isMinor) && sat1fb;
                if (satOnlineFb) {
                    if (!isSectionFree(section.getId(), null, ts2)) {
                        continue;
                    }
                } else {
                    if (!isSectionFree(section.getId(), ts1, ts2)) {
                        continue;
                    }
                }
                boolean satOnlineAvailFb = (isMajorLec || isMinor) && ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                if (satOnlineAvailFb) {
                    if (!isTeacherAvailableForSubject(teacher.getId(), subject.getId(), null, ts2)) {
                        continue;
                    }
                } else {
                    if (!isTeacherAvailableForSubject(teacher.getId(), subject.getId(), ts1, ts2)) {
                        continue;
                    }
                }

                Room room = null;
                boolean onlineTs1 = false;
                boolean onlineTs2 = false;

                if ((isMajorLec || isMinor) && ts1.getDayOfWeek() == DayOfWeek.SATURDAY) {
                    onlineTs1 = true;
                    room = findRoomForSingleSlot(profile, campus, reqRoomType,
                            section.getMaxStudents(), ts2.getId(), isMinor, subject);
                    if (room == null) {
                        continue;
                    }
                } else if (isLab) {
                    room = findRoom(profile, campus, reqRoomType,
                            section.getMaxStudents(), ts1.getId(), ts2.getId(),
                            isMinor, subject);
                    if (room == null) {
                        continue;
                    }
                } else {
                    room = findRoom(profile, campus, reqRoomType,
                            section.getMaxStudents(), ts1.getId(), ts2.getId(),
                            isMinor, subject);
                    if (room == null) {
                        Room roomTs1 = findRoomForSingleSlot(profile, campus, reqRoomType,
                                section.getMaxStudents(), ts1.getId(), isMinor, subject);
                        if (roomTs1 != null) {
                            room = roomTs1;
                            onlineTs2 = true;
                        } else {
                            Room roomTs2 = findRoomForSingleSlot(profile, campus, reqRoomType,
                                    section.getMaxStudents(), ts2.getId(), isMinor, subject);
                            if (roomTs2 != null) {
                                room = roomTs2;
                                onlineTs1 = true;
                            } else {
                                onlineTs1 = true;
                                onlineTs2 = true;
                            }
                        }
                    }
                }
                if (room != null) {
                    Timeslot rct1 = onlineTs1 ? null : ts1;
                    Timeslot rct2 = onlineTs2 ? null : ts2;
                    if (!isRoomFree(room.getId(), rct1, rct2)) {
                        continue;
                    }
                }
                boolean online = onlineTs1 || onlineTs2;
                lockTeacher(teacher.getId(), ts1, ts2);
                boolean sat1fb2 = ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                boolean satOnlineFb2 = (isMajorLec || isMinor) && sat1fb2;
                lockSection(section.getId(), ts1, ts2);
                addToTeacherDayLoad(teacher.getId(), ts1, ts2);
                if (room != null) {
                    lockRoom(room.getId(), onlineTs1 ? null : ts1, onlineTs2 ? null : ts2);
                }

                Schedule schedule = Schedule.builder()
                        .subject(subject).room(room).teacher(teacher)
                        .timeslot(ts1).timeslot2(ts2).section(section)
                        .semester(semester).schoolYear(schoolYear)
                        .campus(room != null ? room.getCampus() : campus)
                        .sessionType(sessionType)
                        .isOnline(online)
                        .status(ScheduleStatus.DRAFT)
                        .build();

                Schedule saved = scheduleRepository.save(schedule);
                scheduleRepository.flush();
                log.warn("⚠ Fallback teacher used: {} for {} / {}",
                        teacher.getFullName(), subject.getCode(), section.getDisplayLabel());
                return saved;
            }
        }

        // ── Truly exhausted — return placeholder (caller decides whether to keep or delete)
        log.error("✗ EXHAUSTED all combinations for {} / {}",
                subject.getCode(), section.getDisplayLabel());
        return saveConflictPlaceholder(subject, section, campus, semester, schoolYear);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // In-memory lock tables
    // ═════════════════════════════════════════════════════════════════════════
    private void lockTeacher(Long teacherId, Timeslot ts1, Timeslot ts2) {
        Set<Long> s = teacherLocks.computeIfAbsent(teacherId, k -> new HashSet<>());
        if (ts1 != null) {
            s.add(ts1.getId());
        }
        if (ts2 != null) {
            s.add(ts2.getId());
        }
    }

    private void lockRoom(Long roomId, Timeslot ts1, Timeslot ts2) {
        Set<Long> s = roomLocks.computeIfAbsent(roomId, k -> new HashSet<>());
        if (ts1 != null) {
            s.add(ts1.getId());
        }
        if (ts2 != null) {
            s.add(ts2.getId());
        }
        lockRoomWithTime(roomId, ts1, ts2);
    }

    private void lockSection(Long sectionId, Timeslot ts1, Timeslot ts2) {
        Set<Long> s = sectionLocks.computeIfAbsent(sectionId, k -> new HashSet<>());
        if (ts1 != null) {
            s.add(ts1.getId());
        }
        if (ts2 != null) {
            s.add(ts2.getId());
        }
        // Also update time-based map so isSectionFree catches overlaps
        addToDayLoad(sectionId, ts1, ts2);
    }

    private boolean isTeacherFree(Long teacherId, Timeslot ts1, Timeslot ts2) {
        Set<Long> locked = teacherLocks.getOrDefault(teacherId, Set.of());
        boolean ts1IdFree = ts1 == null || !locked.contains(ts1.getId());
        boolean ts2IdFree = ts2 == null || !locked.contains(ts2.getId());
        if (!ts1IdFree || !ts2IdFree) {
            return false;
        }

        Map<DayOfWeek, List<int[]>> dayMap = teacherDaySlots.getOrDefault(teacherId, Map.of());
        if (ts1 != null) {
            List<int[]> slots = dayMap.getOrDefault(ts1.getDayOfWeek(), List.of());
            int s = ts1.getStartTime().getHour() * 60 + ts1.getStartTime().getMinute();
            int e = ts1.getEndTime().getHour() * 60 + ts1.getEndTime().getMinute();
            for (int[] existing : slots) {
                if (s < existing[1] && e > existing[0]) {
                    return false;
                }
            }
        }
        if (ts2 != null) {
            List<int[]> slots = dayMap.getOrDefault(ts2.getDayOfWeek(), List.of());
            int s = ts2.getStartTime().getHour() * 60 + ts2.getStartTime().getMinute();
            int e = ts2.getEndTime().getHour() * 60 + ts2.getEndTime().getMinute();
            for (int[] existing : slots) {
                if (s < existing[1] && e > existing[0]) {
                    return false;
                }
            }
        }
        return true;
    }

    private final Map<Long, Map<DayOfWeek, List<int[]>>> roomDaySlots = new HashMap<>();

    private void lockRoomWithTime(Long roomId, Timeslot ts1, Timeslot ts2) {
        Map<DayOfWeek, List<int[]>> dayMap
                = roomDaySlots.computeIfAbsent(roomId, k -> new HashMap<>());
        if (ts1 != null) {
            int s = ts1.getStartTime().getHour() * 60 + ts1.getStartTime().getMinute();
            int e = ts1.getEndTime().getHour() * 60 + ts1.getEndTime().getMinute();
            dayMap.computeIfAbsent(ts1.getDayOfWeek(), k -> new ArrayList<>()).add(new int[]{s, e});
        }
        if (ts2 != null) {
            int s = ts2.getStartTime().getHour() * 60 + ts2.getStartTime().getMinute();
            int e = ts2.getEndTime().getHour() * 60 + ts2.getEndTime().getMinute();
            dayMap.computeIfAbsent(ts2.getDayOfWeek(), k -> new ArrayList<>()).add(new int[]{s, e});
        }
    }

    private boolean isRoomFreeById(Long roomId, long ts1Id, long ts2Id) {
        Set<Long> locked = roomLocks.getOrDefault(roomId, Set.of());
        return !locked.contains(ts1Id) && !locked.contains(ts2Id);
    }

    private boolean isRoomFree(Long roomId, Timeslot ts1, Timeslot ts2) {
        Set<Long> locked = roomLocks.getOrDefault(roomId, Set.of());
        if ((ts1 != null && locked.contains(ts1.getId()))
                || (ts2 != null && locked.contains(ts2.getId()))) {
            return false;
        }
        Map<DayOfWeek, List<int[]>> dayMap = roomDaySlots.getOrDefault(roomId, Map.of());
        if (ts1 != null) {
            List<int[]> slots = dayMap.getOrDefault(ts1.getDayOfWeek(), List.of());
            int s = ts1.getStartTime().getHour() * 60 + ts1.getStartTime().getMinute();
            int e = ts1.getEndTime().getHour() * 60 + ts1.getEndTime().getMinute();
            for (int[] existing : slots) {
                if (s < existing[1] && e > existing[0]) {
                    return false;
                }
            }
        }
        if (ts2 != null) {
            List<int[]> slots = dayMap.getOrDefault(ts2.getDayOfWeek(), List.of());
            int s = ts2.getStartTime().getHour() * 60 + ts2.getStartTime().getMinute();
            int e = ts2.getEndTime().getHour() * 60 + ts2.getEndTime().getMinute();
            for (int[] existing : slots) {
                if (s < existing[1] && e > existing[0]) {
                    return false;
                }
            }
        }
        return true;
    }

    private boolean isSectionFree(Long sectionId, Timeslot ts1, Timeslot ts2) {
        // Check ID-based lock first (fast path)
        Set<Long> locked = sectionLocks.getOrDefault(sectionId, Set.of());
        boolean ts1IdFree = ts1 == null || !locked.contains(ts1.getId());
        boolean ts2IdFree = ts2 == null || !locked.contains(ts2.getId());
        if (!ts1IdFree || !ts2IdFree) {
            return false;
        }

        // Also check time overlap — different duration slots at same clock time
        // must not be assigned to the same section
        Map<DayOfWeek, List<int[]>> dayMap = sectionDaySlots.getOrDefault(sectionId, Map.of());
        if (ts1 != null) {
            List<int[]> slots = dayMap.getOrDefault(ts1.getDayOfWeek(), List.of());
            int s = ts1.getStartTime().getHour() * 60 + ts1.getStartTime().getMinute();
            int e = ts1.getEndTime().getHour() * 60 + ts1.getEndTime().getMinute();
            for (int[] existing : slots) {
                if (s < existing[1] && e > existing[0]) {
                    return false; // overlap

                }
            }
        }
        if (ts2 != null) {
            List<int[]> slots = dayMap.getOrDefault(ts2.getDayOfWeek(), List.of());
            int s = ts2.getStartTime().getHour() * 60 + ts2.getStartTime().getMinute();
            int e = ts2.getEndTime().getHour() * 60 + ts2.getEndTime().getMinute();
            for (int[] existing : slots) {
                if (s < existing[1] && e > existing[0]) {
                    return false; // overlap

                }
            }
        }
        return true;
    }

    private boolean isTeacherAvailable(Long teacherId, Timeslot ts1, Timeslot ts2) {
        Set<Long> unavail = teacherUnavailable.getOrDefault(teacherId, Set.of());
        boolean ts1Ok = ts1 == null || !unavail.contains(ts1.getId());
        boolean ts2Ok = ts2 == null || !unavail.contains(ts2.getId());
        return ts1Ok && ts2Ok;
    }

    private boolean isTeacherAvailableForSubject(Long teacherId, Long subjectId,
            Timeslot ts1, Timeslot ts2) {
        // Finalized assignments override self-reported unavailability
        Set<Long> finalized = finalizedTeachersBySubject.getOrDefault(subjectId, Set.of());
        if (finalized.contains(teacherId)) {
            return true;
        }
        return isTeacherAvailable(teacherId, ts1, ts2);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Soft constraint tracking (day load per section)
    // ═════════════════════════════════════════════════════════════════════════
    /**
     * sectionId → dayOfWeek → list of slot numbers (for soft constraint checks)
     */
    // sectionId → dayOfWeek → set of start times in minutes (tracks physical time, not slot number)
// sectionId → dayOfWeek → set of (startMinutes, endMinutes) pairs
    private final Map<Long, Map<DayOfWeek, List<int[]>>> sectionDaySlots = new HashMap<>();
    private final Map<Long, Map<DayOfWeek, List<int[]>>> teacherDaySlots = new HashMap<>();

    private void addToDayLoad(Long sectionId, Timeslot ts1, Timeslot ts2) {
        Map<DayOfWeek, List<int[]>> dayMap
                = sectionDaySlots.computeIfAbsent(sectionId, k -> new HashMap<>());
        if (ts1 != null) {
            int start = ts1.getStartTime().getHour() * 60 + ts1.getStartTime().getMinute();
            int end = ts1.getEndTime().getHour() * 60 + ts1.getEndTime().getMinute();
            dayMap.computeIfAbsent(ts1.getDayOfWeek(), k -> new ArrayList<>()).add(new int[]{start, end});
        }
        if (ts2 != null) {
            int start = ts2.getStartTime().getHour() * 60 + ts2.getStartTime().getMinute();
            int end = ts2.getEndTime().getHour() * 60 + ts2.getEndTime().getMinute();
            dayMap.computeIfAbsent(ts2.getDayOfWeek(), k -> new ArrayList<>()).add(new int[]{start, end});
        }
    }

    private void addToTeacherDayLoad(Long teacherId, Timeslot ts1, Timeslot ts2) {
        Map<DayOfWeek, List<int[]>> dayMap
                = teacherDaySlots.computeIfAbsent(teacherId, k -> new HashMap<>());
        if (ts1 != null) {
            int start = ts1.getStartTime().getHour() * 60 + ts1.getStartTime().getMinute();
            int end = ts1.getEndTime().getHour() * 60 + ts1.getEndTime().getMinute();
            dayMap.computeIfAbsent(ts1.getDayOfWeek(), k -> new ArrayList<>()).add(new int[]{start, end});
        }
        if (ts2 != null) {
            int start = ts2.getStartTime().getHour() * 60 + ts2.getStartTime().getMinute();
            int end = ts2.getEndTime().getHour() * 60 + ts2.getEndTime().getMinute();
            dayMap.computeIfAbsent(ts2.getDayOfWeek(), k -> new ArrayList<>()).add(new int[]{start, end});
        }
    }

    // R4: returns true if placing ts would be adjacent to an existing class after 2 already placed
    private boolean isAdjacentAfter2(Long sectionId, Timeslot ts,
            Semester semester, String schoolYear) {
        Map<DayOfWeek, List<int[]>> dayMap = sectionDaySlots.getOrDefault(sectionId, Map.of());
        List<int[]> slots = dayMap.getOrDefault(ts.getDayOfWeek(), List.of());
        if (slots.size() < 2) {
            return false;
        }
        int newStart = ts.getStartTime().getHour() * 60 + ts.getStartTime().getMinute();
        int newEnd = ts.getEndTime().getHour() * 60 + ts.getEndTime().getMinute();

        // Count how many back-to-back classes already exist ending at newStart
        // or starting at newEnd (i.e. the new slot would extend a consecutive chain)
        int chainBefore = 0;
        int scan = newStart;
        for (int i = 0; i < 10; i++) {
            final int s = scan;
            int[] prev = slots.stream().filter(x -> x[1] == s).findFirst().orElse(null);
            if (prev == null) {
                break;
            }
            chainBefore++;
            scan = prev[0];
        }
        int chainAfter = 0;
        scan = newEnd;
        for (int i = 0; i < 10; i++) {
            final int e = scan;
            int[] next = slots.stream().filter(x -> x[0] == e).findFirst().orElse(null);
            if (next == null) {
                break;
            }
            chainAfter++;
            scan = next[1];
        }
        // Total chain length if we insert the new slot
        int totalChain = chainBefore + 1 + chainAfter;
        return totalChain > 2; // enforce max 2 consecutive classes
    }

    // Returns true if placing ts would create more than 2 back-to-back classes
    private boolean wouldExceedConsecutive(Long sectionId, Timeslot ts) {
        Map<DayOfWeek, List<int[]>> dayMap = sectionDaySlots.getOrDefault(sectionId, Map.of());
        List<int[]> slots = dayMap.getOrDefault(ts.getDayOfWeek(), List.of());
        if (slots.isEmpty()) {
            return false;
        }
        int newStart = ts.getStartTime().getHour() * 60 + ts.getStartTime().getMinute();
        int newEnd = ts.getEndTime().getHour() * 60 + ts.getEndTime().getMinute();
        int count = 1;
        // Walk backward: find slots that end exactly when next starts
        int scanStart = newStart;
        for (int i = 0; i < 10; i++) {
            int s = scanStart;
            int[] prev = slots.stream().filter(x -> x[1] == s).findFirst().orElse(null);
            if (prev == null) {
                break;
            }
            count++;
            scanStart = prev[0];
        }
        // Walk forward: find slots that start exactly when previous ends
        int scanEnd = newEnd;
        for (int i = 0; i < 10; i++) {
            int e = scanEnd;
            int[] next = slots.stream().filter(x -> x[0] == e).findFirst().orElse(null);
            if (next == null) {
                break;
            }
            count++;
            scanEnd = next[1];
        }
        return count > 2;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Timeslot pair builder
    // ═════════════════════════════════════════════════════════════════════════
    /**
     * Builds an ordered list of (ts1, ts2) pairs to try for this subject.
     * Saturday-online pairs are prepended when applicable (rules 9/10).
     */
// REPLACE WITH:
    private List<TimeslotPair> buildTimeslotPairs(
            int reqDuration, boolean isLab,
            Set<DayOfWeek> excludeDays,
            boolean requireConsecutive, boolean requireSameTime,
            Long sectionId) {

        List<Timeslot> candidates = allTimeslots.stream()
                .filter(ts -> ts.getDurationMinutes() == reqDuration)
                .filter(ts -> !excludeDays.contains(ts.getDayOfWeek()))
                .filter(ts -> ts.getDayOfWeek() != DayOfWeek.SUNDAY)
                .filter(ts -> !isLab || ts.getDayOfWeek() != DayOfWeek.SATURDAY) // R8: LAB never Saturday
                .toList();

        List<TimeslotPair> result = new ArrayList<>();

        // Only consecutive-day pairs (R13): Mon-Tue, Tue-Wed, Wed-Thu, Thu-Fri
        // Round-robin interleaving across all four pairs at the same time band
        // so subjects spread evenly across the full week.
        List<DayOfWeek> orderedDays = List.of(
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY);

        // Collect timeslots grouped by day, sorted by start time
        // Collect timeslots grouped by day, sorted by start time
        Map<DayOfWeek, List<Timeslot>> byDay = new java.util.LinkedHashMap<>();
        // Sort days so under-used days (fewer section slots) come first — spreads classes across all days
        List<DayOfWeek> sortedDays = orderedDays.stream()
                .sorted(Comparator
                        .comparingInt((DayOfWeek d) -> d == DayOfWeek.SATURDAY ? 1 : 0)
                        .thenComparingInt(d -> (int) sectionDaySlots.values().stream()
                        .mapToLong(m -> m.getOrDefault(d, List.of()).size())
                        .sum()))
                .collect(Collectors.toList());
        for (DayOfWeek d : sortedDays) {
            List<Timeslot> daySlots = candidates.stream()
                    .filter(ts -> ts.getDayOfWeek() == d)
                    .sorted(Comparator.comparingInt(
                            ts -> ts.getStartTime().getHour() * 60 + ts.getStartTime().getMinute()))
                    .collect(Collectors.toList());
            if (!daySlots.isEmpty()) {
                byDay.put(d, daySlots);
            }
        }

        List<DayOfWeek> presentDays = new ArrayList<>(byDay.keySet());

        if (requireConsecutive) {
            // Consecutive adjacent pairs only (R1/R13) — matched by start time
            List<DayOfWeek[]> adjacentPairs = new ArrayList<>();
            for (int i = 0; i < orderedDays.size() - 1; i++) {
                DayOfWeek d1 = orderedDays.get(i);
                DayOfWeek d2 = orderedDays.get(i + 1);
                if (byDay.containsKey(d1) && byDay.containsKey(d2)) {
                    adjacentPairs.add(new DayOfWeek[]{d1, d2});
                }
            }
            // Sort pairs so least-loaded day-pairs come first
            // This ensures Friday and Saturday get filled before Mon-Tue get overloaded
            adjacentPairs.sort(Comparator.comparingInt(pair -> {
                int load1 = (int) sectionDaySlots.values().stream()
                        .mapToLong(m -> m.getOrDefault(pair[0], List.of()).size())
                        .sum();
                int load2 = (int) sectionDaySlots.values().stream()
                        .mapToLong(m -> m.getOrDefault(pair[1], List.of()).size())
                        .sum();
                return load1 + load2;
            }));
            for (DayOfWeek[] pair : adjacentPairs) {
                // R8: LAB sessions never on Saturday
                if (isLab && (pair[0] == DayOfWeek.SATURDAY || pair[1] == DayOfWeek.SATURDAY)) {
                    continue;
                }
                List<Timeslot> slotsA = byDay.get(pair[0]);
                List<Timeslot> slotsB = byDay.get(pair[1]);
                Map<Integer, Timeslot> bByStart = new java.util.LinkedHashMap<>();
                for (Timeslot ts : slotsB) {
                    bByStart.put(ts.getStartTime().getHour() * 60 + ts.getStartTime().getMinute(), ts);
                }
                for (Timeslot tsA : slotsA) {
                    int startMin = tsA.getStartTime().getHour() * 60 + tsA.getStartTime().getMinute();
                    Timeslot tsB = bByStart.get(startMin);
                    if (tsB != null) {
                        result.add(new TimeslotPair(tsA, tsB));
                    }
                }
            }
        } else {
            log.debug("buildTimeslotPairs: using any-day any-time mode, presentDays={}", presentDays);
            for (int i = 0; i < presentDays.size(); i++) {
                DayOfWeek d1 = presentDays.get(i);
                List<Timeslot> slotsA = byDay.get(d1);
                for (int j = i + 1; j < presentDays.size(); j++) {
                    DayOfWeek d2 = presentDays.get(j);
                    List<Timeslot> slotsB = byDay.get(d2);
                    if (requireSameTime) {
                        // same start time only
                        Map<Integer, Timeslot> bByStart = new java.util.LinkedHashMap<>();
                        for (Timeslot ts : slotsB) {
                            bByStart.put(ts.getStartTime().getHour() * 60 + ts.getStartTime().getMinute(), ts);
                        }
                        for (Timeslot tsA : slotsA) {
                            int startMin = tsA.getStartTime().getHour() * 60 + tsA.getStartTime().getMinute();
                            Timeslot tsB = bByStart.get(startMin);
                            if (tsB != null) {
                                result.add(new TimeslotPair(tsA, tsB));
                            }
                        }
                    } else {
                        // any time combination — maximum flexibility for hasLab LECTURE
                        for (Timeslot tsA : slotsA) {
                            for (Timeslot tsB : slotsB) {
                                result.add(new TimeslotPair(tsA, tsB));
                            }
                        }
                    }
                }
            }
        }

        // For 60-min slots: prefer start times NOT already used by 90-min slots
        // in this section, to avoid same-row display collisions
        if (reqDuration == 60 && sectionId != null) {
            Set<Integer> usedStarts = new HashSet<>();
            Map<DayOfWeek, List<int[]>> secMap = sectionDaySlots.getOrDefault(sectionId, Map.of());
            for (List<int[]> slots : secMap.values()) {
                for (int[] s : slots) {
                    usedStarts.add(s[0]); // exclude ALL used start times, not just 90-min
                }
            }
            if (!usedStarts.isEmpty()) {
                // Partition: preferred (unique start) first, deprioritized (shared start) last
                List<TimeslotPair> preferred = new ArrayList<>();
                List<TimeslotPair> deprioritized = new ArrayList<>();
                for (TimeslotPair p : result) {
                    int startMin = p.ts1().getStartTime().getHour() * 60
                            + p.ts1().getStartTime().getMinute();
                    if (usedStarts.contains(startMin)) {
                        deprioritized.add(p);
                    } else {
                        preferred.add(p);
                    }
                }
                result.clear();
                result.addAll(preferred);
                result.addAll(deprioritized);
            }
        }

        return result;
    }

    private List<User> buildTeacherCandidates(Subject subject, Section section,
            Semester semester, String schoolYear) {

        List<User> ordered = new ArrayList<>();

        // Priority 1: finalized assignment from Program Head
        subjectAssignmentRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        List.of(subject.getId()), semester.name(), schoolYear)
                .stream()
                .filter(a -> a.isFinalized())
                .filter(a -> a.getTeacher() != null && a.getTeacher().isActive())
                .map(SubjectAssignment::getTeacher)
                .forEach(ordered::add);

        // Priority 2: non-finalized assignment
        subjectAssignmentRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        List.of(subject.getId()), semester.name(), schoolYear)
                .stream()
                .filter(a -> !a.isFinalized())
                .filter(a -> a.getTeacher() != null && a.getTeacher().isActive())
                .map(SubjectAssignment::getTeacher)
                .filter(u -> !ordered.contains(u))
                .forEach(ordered::add);

        boolean isGE = subject.getSubjectType() == SubjectType.MINOR;

        if (isGE) {
            // GE teachers sorted by: preference first, then least load
            allProfiles.stream()
                    .filter(TeacherProfile::isGETeacher)
                    .map(TeacherProfile::getUser)
                    .filter(u -> u != null && u.isActive())
                    .filter(u -> !ordered.contains(u))
                    .sorted(Comparator
                            .comparingInt((User u) -> teacherSubjectPreferenceRepository
                            .findByTeacherIdAndSubjectIdAndSemesterAndSchoolYear(
                                    u.getId(), subject.getId(), semester, schoolYear)
                            .isPresent() ? 0 : 1)
                            .thenComparingLong(u -> teacherLocks
                            .getOrDefault(u.getId(), Set.of()).size()))
                    .forEach(ordered::add);
        } else if (subject.getDepartment() != null) {
            // Dept teachers: prefer those NOT already teaching this subject, then least loaded
            Set<Long> alreadyTeaching = scheduleRepository
                    .findBySubjectIdAndSemesterAndSchoolYear(subject.getId(), semester, schoolYear)
                    .stream()
                    .filter(s -> s.getStatus() == ScheduleStatus.DRAFT && s.getTeacher() != null)
                    .map(s -> s.getTeacher().getId())
                    .collect(Collectors.toSet());

            List<User> deptTeachers = allProfiles.stream()
                    .filter(p -> p.getDepartment() != null
                    && p.getDepartment().getId().equals(subject.getDepartment().getId()))
                    .map(TeacherProfile::getUser)
                    .filter(u -> u != null && u.isActive())
                    .filter(u -> !ordered.contains(u))
                    .sorted(Comparator
                            .comparingInt((User u) -> alreadyTeaching.contains(u.getId()) ? 1 : 0)
                            .thenComparingLong(u -> teacherLocks
                            .getOrDefault(u.getId(), Set.of()).size()))
                    .collect(Collectors.toList());

            ordered.addAll(deptTeachers);

            // Cross-dept fallback — include ALL active teachers (GEN_ED too)
            // when subject's dept has no dedicated teachers
            allProfiles.stream()
                    .map(TeacherProfile::getUser)
                    .filter(u -> u != null && u.isActive())
                    .filter(u -> !ordered.contains(u))
                    .sorted(Comparator.comparingLong(u
                            -> teacherLocks.getOrDefault(u.getId(), Set.of()).size()))
                    .forEach(ordered::add);
        }

        return ordered;
    }

    /**
     * Absolute last resort: all active teachers sorted by load
     */
    private List<User> buildAllTeacherFallback(Semester semester, String schoolYear) {
        return allProfiles.stream()
                .map(TeacherProfile::getUser)
                .filter(u -> u != null && u.isActive())
                .sorted(Comparator.comparingLong(u
                        -> teacherLocks.getOrDefault(u.getId(), Set.of()).size()))
                .toList();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Room finder (R3, R7, R12)
    // ═════════════════════════════════════════════════════════════════════════
    private Room findRoom(TeacherProfile profile, Campus defaultCampus,
            RoomType roomType, int minCapacity,
            long ts1Id, long ts2Id,
            boolean isMinor, Subject subject) {

        boolean isLabSession = roomType == RoomType.LABORATORY;
        boolean isCPESubject = subject.getDepartment() != null
                && "CPE".equalsIgnoreCase(subject.getDepartment().getCode().trim());
        boolean isHardwareLab = isLabSession && isCPESubject;

        Long campusId = defaultCampus.getId();
        if (profile != null && profile.isGETeacher() && profile.getPreferredCampus() != null) {
            campusId = profile.getPreferredCampus().getId();
        }
        final Long targetCampusId = campusId;

        // Try target campus first, then any campus for GE teachers
        List<Room> pool = allRooms.stream()
                .filter(r -> r.getRoomType() == roomType)
                .toList(); // capacity enforced below via sorting; all rooms considered

        // Sort: correct room type first, then least-used room (maximize spread),
        // then 306 preferred for major lectures, then target campus
// Sort: 401–408 first for major lectures (maximize usage), 306 as last resort, then least-used
        pool = pool.stream()
                .sorted(Comparator
                        .comparingInt((Room r) -> {
                            if (isLabSession) {
                                return 0; // labs: no preference

                                                        }if (isMinor) {
                                return 0;      // minor: all valid rooms equal
                            }                            // major lecture: prefer 401–408, deprioritize 306
                            if (MINOR_ROOM_NUMBERS.contains(r.getRoomNumber())) {
                                return 0;
                            }
                            if (ROOM_306_NUMBER.equals(r.getRoomNumber())) {
                                return 1;
                            }
                            return 2;
                        })
                        .thenComparingInt(r -> roomLocks.getOrDefault(r.getId(), Set.of()).size())
                        .thenComparingInt(r -> r.getCampus() != null && r.getCampus().getId().equals(targetCampusId) ? 0 : 1))
                .toList();

        Timeslot fakeTs1 = allTimeslots.stream().filter(t -> t.getId().equals(ts1Id)).findFirst().orElse(null);
        Timeslot fakeTs2 = allTimeslots.stream().filter(t -> t.getId().equals(ts2Id)).findFirst().orElse(null);
        for (Room r : pool) {
            // R7: room must be free at both timeslots (ID + time-overlap check)
            if (!isRoomFree(r.getId(), fakeTs1, fakeTs2)) {
                continue;
            }

            String num = r.getRoomNumber();

            // R12: 305 — CPE hardware lab only (non-CPE labs cannot use 305)
            if (ROOM_305_NUMBER.equals(num) && !isHardwareLab) {
                continue;
            }
            // CPE hardware labs prefer 305 but can fall back to 301–304
            // (no hard exclusion of 301–304 for CPE)

            // R12: 301–304 — computer labs, LAB sessions only
            if (COMPUTER_LAB_NUMBERS.contains(num) && !isLabSession) {
                continue;
            }

            // R12: 306 — major LECTURE only (not minor, not lab)
            if (ROOM_306_NUMBER.equals(num) && (isMinor || isLabSession)) {
                continue;
            }

            // R3: minor → must be 401–408
            if (isMinor && !MINOR_ROOM_NUMBERS.contains(num)) {
                continue;
            }
            // R12: 401–408 = minor/GE rooms — LAB must NOT use them,
            // but major LECTURE can use them (306 is deprioritized, not exclusive)
            if (!isMinor && isLabSession && MINOR_ROOM_NUMBERS.contains(num)) {
                continue;
            }

            return r;
        }

        return null;
    }

    private Room findRoomForSingleSlot(TeacherProfile profile, Campus defaultCampus,
            RoomType roomType, int minCapacity,
            long tsId, boolean isMinor, Subject subject) {

        boolean isLabSession = roomType == RoomType.LABORATORY;
        boolean isCPESubject = subject.getDepartment() != null
                && "CPE".equalsIgnoreCase(subject.getDepartment().getCode().trim());
        boolean isHardwareLab = isLabSession && isCPESubject;

        Long campusId = defaultCampus.getId();
        if (profile != null && profile.isGETeacher() && profile.getPreferredCampus() != null) {
            campusId = profile.getPreferredCampus().getId();
        }
        final Long targetCampusId = campusId;

        List<Room> pool = allRooms.stream()
                .filter(r -> r.getRoomType() == roomType)
                .sorted(Comparator
                        .comparingInt((Room r) -> {
                            if (isLabSession) return 0;
                            if (isMinor) return 0;
                            // major lecture: prefer 401–408, deprioritize 306
                            if (MINOR_ROOM_NUMBERS.contains(r.getRoomNumber())) return 0;
                            if (ROOM_306_NUMBER.equals(r.getRoomNumber())) return 1;
                            return 2;
                        })
                        .thenComparingInt(r -> roomLocks.getOrDefault(r.getId(), Set.of()).size())
                        .thenComparingInt(r -> r.getCampus() != null
                        && r.getCampus().getId().equals(targetCampusId) ? 0 : 1))
                .toList();

        Timeslot fTs = allTimeslots.stream().filter(t -> t.getId().equals(tsId)).findFirst().orElse(null);
        for (Room r : pool) {
            if (!isRoomFree(r.getId(), fTs, null)) {
                continue;
            }
            String num = r.getRoomNumber();
            if (ROOM_305_NUMBER.equals(num) && !isHardwareLab) {
                continue;
            }
            if (COMPUTER_LAB_NUMBERS.contains(num) && !isLabSession) {
                continue;
            }
            if (ROOM_306_NUMBER.equals(num) && (isMinor || isLabSession)) {
                continue;
            }
            if (isMinor && !MINOR_ROOM_NUMBERS.contains(num)) {
                continue;
            }
            if (!isMinor && MINOR_ROOM_NUMBERS.contains(num)) {
                continue;
            }
            return r;
        }
        return null;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // BSCS/BSIT MergedSection linking (R11)
    // ═════════════════════════════════════════════════════════════════════════
    private void linkBSITMergedSections(Section bscsSection,
            Semester semester, String schoolYear) {
        if (!bscsSection.getCourse().getCode().equals("BSCS")) {
            return;
        }

        List<Section> bsitSections = sectionRepository
                .findBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(Section::isActive)
                .filter(s -> s.getCourse().getCode().equals("BSIT"))
                .filter(s -> s.getYearLevel() == bscsSection.getYearLevel())
                .toList();

        if (bsitSections.isEmpty()) {
            return;
        }

        List<Schedule> sharedSchedules = scheduleRepository
                .findSectionSchedules(bscsSection.getId(), semester, schoolYear)
                .stream()
                .filter(s -> s.getSubject().getCourseSubjects() != null
                && s.getSubject().getCourseSubjects().stream()
                        .anyMatch(cs -> cs.isShared()
                        && cs.getCourse().getCode().equals("BSCS")))
                .toList();

        for (Schedule shared : sharedSchedules) {
            User createdBy = shared.getTeacher();
            if (createdBy == null) {
                continue;
            }

            for (Section bsit : bsitSections) {
                boolean exists = mergedSectionRepository
                        .existsByPrimarySectionIdAndSecondarySectionIdAndSubjectIdAndSemesterAndSchoolYear(
                                bscsSection.getId(), bsit.getId(),
                                shared.getSubject().getId(),
                                semester.name(), schoolYear);
                if (!exists) {
                    MergedSection ms = mergedSectionRepository.save(
                            MergedSection.builder()
                                    .primarySection(bscsSection)
                                    .secondarySection(bsit)
                                    .subject(shared.getSubject())
                                    .semester(semester.name())
                                    .schoolYear(schoolYear)
                                    .createdBy(createdBy)
                                    .build());
                    shared.setMergedSection(ms);
                    scheduleRepository.save(shared);
                    log.info("MergedSection: BSCS {} + BSIT {} → {}",
                            bscsSection.getDisplayLabel(),
                            bsit.getDisplayLabel(),
                            shared.getSubject().getCode());
                }
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Campus resolver
    // ═════════════════════════════════════════════════════════════════════════
    private Campus resolveCampus(Section section) {
        String deptCode = section.getCourse().getDepartment().getCode();
        String code = HEALTH_DEPT_CODES.contains(deptCode) ? CHS_CODE : CLI_CODE;
        Campus c = campusByCode.get(code);
        if (c == null) {
            throw new IllegalStateException("Campus not found: " + code);
        }
        return c;
    }

    private boolean isHealthSection(Section s) {
        return HEALTH_DEPT_CODES.contains(s.getCourse().getDepartment().getCode());
    }

    private TeacherProfile profileOf(User teacher) {
        return allProfiles.stream()
                .filter(p -> p.getUser() != null && p.getUser().getId().equals(teacher.getId()))
                .findFirst().orElse(null);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Conflict save (only when truly exhausted)
    // ═════════════════════════════════════════════════════════════════════════
    // Saves a CONFLICTED schedule AND logs it — use only for FINAL unresolvable conflicts
    private Schedule saveConflict(Subject subject, Section section, Campus campus,
            Semester semester, String schoolYear, String reason) {
        log.error("CONFLICT: {} / {} — {}", subject.getCode(), section.getDisplayLabel(), reason);
        Schedule s = Schedule.builder()
                .subject(subject).section(section)
                .semester(semester).schoolYear(schoolYear).campus(campus)
                .status(ScheduleStatus.CONFLICTED).build();
        s = scheduleRepository.saveAndFlush(s);
        conflictLogService.log(s, ConflictLog.ConflictType.TEACHER_DOUBLE_BOOKED, reason);
        return s;
    }

    // Saves a CONFLICTED schedule WITHOUT a ConflictLog — safe to delete later
    private Schedule saveConflictPlaceholder(Subject subject, Section section, Campus campus,
            Semester semester, String schoolYear) {
        Schedule s = Schedule.builder()
                .subject(subject).section(section)
                .semester(semester).schoolYear(schoolYear).campus(campus)
                .status(ScheduleStatus.CONFLICTED).build();
        return scheduleRepository.saveAndFlush(s);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Draft cleanup
    // ═════════════════════════════════════════════════════════════════════════
    private void clearDrafts(Semester semester, String schoolYear) {
        List<Schedule> del = scheduleRepository.findBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(s -> s.getStatus() == ScheduleStatus.DRAFT
                || s.getStatus() == ScheduleStatus.CONFLICTED)
                .toList();
        scheduleRepository.deleteAll(del);
        mergedSectionRepository.findBySemesterAndSchoolYear(semester.name(), schoolYear)
                .forEach(mergedSectionRepository::delete);
        sectionDaySlots.clear();
        teacherDaySlots.clear();
        roomDaySlots.clear();
        log.info("Cleared {} DRAFT/CONFLICTED entries", del.size());
    }

    private void clearDraftsForCourse(Long courseId, Semester semester, String schoolYear) {
        List<Schedule> del = scheduleRepository.findBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(s -> s.getSection() != null
                && s.getSection().getCourse().getId().equals(courseId))
                .filter(s -> s.getStatus() == ScheduleStatus.DRAFT
                || s.getStatus() == ScheduleStatus.CONFLICTED)
                .toList();
        scheduleRepository.deleteAll(del);
        sectionDaySlots.clear();
        teacherDaySlots.clear();
        roomDaySlots.clear();
        log.info("Cleared {} DRAFT/CONFLICTED entries for courseId={}", del.size(), courseId);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Section auto-creation
    // ═════════════════════════════════════════════════════════════════════════
    private void ensureSectionsExist(Long courseId, Semester semester, String schoolYear) {
        List<SectionConfig> configs = courseId != null
                ? sectionConfigRepository.findByCourseIdAndSemesterAndSchoolYear(
                        courseId, semester.name(), schoolYear)
                : sectionConfigRepository.findBySemesterAndSchoolYear(
                        semester.name(), schoolYear);

        for (SectionConfig cfg : configs) {
            Course course = courseRepository.findById(cfg.getCourse().getId()).orElse(null);
            if (course == null) {
                continue;
            }
            for (int i = 0; i < cfg.getSectionCount(); i++) {
                String name = String.valueOf((char) ('A' + i));
                boolean exists = sectionRepository
                        .existsByCourseIdAndYearLevelAndSectionNameAndSemesterAndSchoolYear(
                                course.getId(), cfg.getYearLevel(), name, semester, schoolYear);
                if (!exists) {
                    sectionRepository.save(Section.builder()
                            .course(course).yearLevel(cfg.getYearLevel())
                            .sectionName(name).semester(semester).schoolYear(schoolYear)
                            .maxStudents((short) 45).build());
                    log.info("Auto-created section {} Y{}", name, cfg.getYearLevel());
                }
            }
        }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Inner record
    // ═════════════════════════════════════════════════════════════════════════
    private record TimeslotPair(Timeslot ts1, Timeslot ts2) {

    }
}
