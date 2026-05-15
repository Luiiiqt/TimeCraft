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
                        .thenComparingInt((Section s)
                                -> s.getCourse().getCode().equals("BSIT") ? 0 : 1)
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
                        lockSection(s.getSection().getId(), s.getTimeslot(), s.getTimeslot2());
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
                        semester);

        log.debug("Section {} | {} subjects", section.getDisplayLabel(), curriculum.size());

        for (CourseSubject cs : curriculum) {
            Subject subject = cs.getSubject();

            // ── BSCS / BSIT shared subject handling ──────────────────────────
            if (cs.isShared()) {
                boolean isBSIT = section.getCourse().getCode().equals("BSIT");
                if (isBSIT) {
                    log.debug("BSIT {} skipping shared {} — handled by BSCS",
                            section.getDisplayLabel(), subject.getCode());
                    continue;
                }
                // BSCS: reuse existing schedule row if already placed by another BSCS section
                List<Schedule> existing = scheduleRepository
                        .findBySubjectIdAndSemesterAndSchoolYear(subject.getId(), semester, schoolYear)
                        .stream()
                        .filter(s -> s.getStatus() == ScheduleStatus.DRAFT)
                        .filter(s -> s.getSection() != null && s.getTeacher() != null && s.getTimeslot() != null)
                        .filter(s -> s.getSection().getCourse().getCode().equals("BSCS"))
                        .filter(s -> !s.getSection().getId().equals(section.getId()))
                        .toList();
                if (!existing.isEmpty()) {
                    result.addAll(existing);
                    continue;
                }
                // Fall through: BSCS schedules this for the first time
            }

            boolean isMajor = subject.getSubjectType() == SubjectType.MAJOR;

            if (isMajor && subject.isHasLab()) {
                Schedule lec = assign(subject, section, campus, semester, schoolYear,
                        SessionType.LECTURE, subjectTeacherCache, Set.of());
                result.add(lec);

                if (lec.getStatus() == ScheduleStatus.CONFLICTED) {
                    log.warn("Skipping LAB for {} / {} — LECTURE failed",
                            subject.getCode(), section.getDisplayLabel());
                } else {
                    if (lec.getTeacher() != null) {
                        subjectTeacherCache.put(subject.getId(), lec.getTeacher());
                    }

                    Set<DayOfWeek> lecDays = new HashSet<>();
                    if (lec.getTimeslot() != null) {
                        lecDays.add(lec.getTimeslot().getDayOfWeek());
                    }
                    if (lec.getTimeslot2() != null) {
                        lecDays.add(lec.getTimeslot2().getDayOfWeek());
                    }

                    Schedule lab = assign(subject, section, campus, semester, schoolYear,
                            SessionType.LABORATORY, subjectTeacherCache, lecDays);
                    result.add(lab);
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
        //    Saturday-online pairs (major lecture / minor) tried first per rules 9/10
        List<TimeslotPair> pairs = buildTimeslotPairs(
                reqDuration, isLab, isMinor || isMajorLec, excludeDays, section, semester, schoolYear);

        // ── Pre-pass: Saturday+weekday pairs only (Room 306 relief for major LECTURE) ──
        if (isMajorLec) {
            for (User teacher : teachers) {
                TeacherProfile profile = profileOf(teacher);
                for (TimeslotPair pair : pairs) {
                    Timeslot ts1 = pair.ts1();
                    Timeslot ts2 = pair.ts2();
                    if (ts1.getDayOfWeek() != DayOfWeek.SATURDAY) continue;
                    if (!isTeacherFree(teacher.getId(), ts1, ts2)) continue;
                    if (!isSectionFree(section.getId(), null, ts2)) continue;
                    // Saturday ts1 is online — teacher has no physical presence,
                    // so only check availability for the in-person ts2
                    if (!isTeacherAvailable(teacher.getId(), null, ts2)) continue;

                    Room satRoom = findRoom(profileOf(teacher), campus, reqRoomType,
                            section.getMaxStudents(), ts2.getId(), ts2.getId(),
                            isMinor, subject);
                    if (satRoom == null) continue;
                    if (!isRoomFree(satRoom.getId(), ts1, ts2)) continue;

                    lockTeacher(teacher.getId(), ts1, ts2);
                    lockSection(section.getId(), null, ts2);
                    addToDayLoad(section.getId(), null, ts2);
                    lockRoom(satRoom.getId(), null, ts2); // Saturday is online — only lock weekday slot

                    Schedule schedule = Schedule.builder()
                            .subject(subject).room(satRoom).teacher(teacher)
                            .timeslot(ts1).timeslot2(ts2).section(section)
                            .semester(semester).schoolYear(schoolYear)
                            .campus(satRoom.getCampus()).sessionType(sessionType)
                            .isOnline(true).status(ScheduleStatus.DRAFT).build();
                    Schedule saved = scheduleRepository.save(schedule);
                    scheduleRepository.flush();
                    log.debug("✓ SAT-ONLINE {} | {} | {} | {} + {}",
                            subject.getCode(), section.getDisplayLabel(),
                            teacher.getFullName(), ts1.getLabel(), ts2.getLabel());
                    return saved;
                }
            }
        }

        // ── CSP search: teacher × pair × room ────────────────────────────────
        for (boolean relaxBreak : new boolean[]{false, true}) {
            for (boolean relaxConsec : new boolean[]{false, true}) {
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
                            if (!isSectionFree(section.getId(), null, ts2)) continue;
                        } else {
                            if (!isSectionFree(section.getId(), ts1, ts2)) continue;
                        }
                        // Teacher declared unavailable at this slot
                        // Saturday ts1 is online — only check ts2 availability
                        boolean satOnlineAvail = (isMajorLec || isMinor) && ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                        if (satOnlineAvail) {
                            if (!isTeacherAvailable(teacher.getId(), null, ts2)) continue;
                        } else {
                            if (!isTeacherAvailable(teacher.getId(), ts1, ts2)) continue;
                        }

                        // ── Soft constraints (relaxed progressively) ──────────
                        if (!relaxBreak && isAdjacentAfter2(section.getId(), ts1, semester, schoolYear)) {
                            continue;
                        }
                        if (!relaxBreak && isAdjacentAfter2(section.getId(), ts2, semester, schoolYear)) {
                            continue;
                        }
                        if (!relaxConsec && wouldExceedConsecutive(section.getId(), ts1)) {
                            continue;
                        }
                        if (!relaxConsec && wouldExceedConsecutive(section.getId(), ts2)) {
                            continue;
                        }

                        // ── Determine online rules ─────────────────────────────
                        boolean sat1 = ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                        boolean satOnline = (isMajorLec || isMinor) && sat1;
                        boolean fullyOnline = isMinor && sat1;

                        // ── Find room ──────────────────────────────────────────
                        Room room = null;
                        if (!fullyOnline) {
                            long roomTs1 = satOnline ? ts2.getId() : ts1.getId();
                            long roomTs2 = ts2.getId();
                            room = findRoom(profile, campus, reqRoomType,
                                    section.getMaxStudents(), roomTs1, roomTs2,
                                    isMinor, subject);

                            // If no room and this is a minor on weekday → go fully online (R3)
                            if (room == null && isMinor) {
                                fullyOnline = true;
                            } // If still no room for non-online → skip this pair, try next
                            else if (room == null) {
                                continue;
                            }
                        }

                        // ── R7: no room double-booking (checked via lock table) ─
                        if (room != null && !isRoomFree(room.getId(), ts1, ts2)) {
                            continue;
                        }

                        // ── All constraints passed — commit ────────────────────
                        lockTeacher(teacher.getId(), ts1, ts2);
                        // Saturday ts1 is online — section has no physical presence,
                        // so only lock the in-person ts2 for section conflicts
                        if (satOnline) {
                            lockSection(section.getId(), null, ts2);
                            addToDayLoad(section.getId(), null, ts2);
                        } else {
                            lockSection(section.getId(), ts1, ts2);
                            addToDayLoad(section.getId(), ts1, ts2);
                        }
                        if (room != null) {
                            if (satOnline) {
                                lockRoom(room.getId(), null, ts2); // Saturday online — room only used at ts2
                            } else {
                                lockRoom(room.getId(), ts1, ts2);
                            }
                        }

                        boolean online = satOnline || fullyOnline;
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
                    if (!isSectionFree(section.getId(), null, ts2)) continue;
                } else {
                    if (!isSectionFree(section.getId(), ts1, ts2)) continue;
                }
                boolean satOnlineAvailFb = (isMajorLec || isMinor) && ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                if (satOnlineAvailFb) {
                    if (!isTeacherAvailable(teacher.getId(), null, ts2)) continue;
                } else {
                    if (!isTeacherAvailable(teacher.getId(), ts1, ts2)) continue;
                }

                boolean sat1 = ts1.getDayOfWeek() == DayOfWeek.SATURDAY;
                boolean satOnline = (isMajorLec || isMinor) && sat1;
                boolean fullyOnline = isMinor && sat1;

                Room room = null;
                if (!fullyOnline) {
                    long roomTs1 = satOnline ? ts2.getId() : ts1.getId();
                    room = findRoom(profile, campus, reqRoomType,
                            section.getMaxStudents(), roomTs1, ts2.getId(),
                            isMinor, subject);
                    if (room == null && isMinor) {
                        fullyOnline = true; 
                    }else if (room == null) {
                        continue;
                    }
                }
                if (room != null && !isRoomFree(room.getId(), ts1, ts2)) {
                    continue;
                }

lockTeacher(teacher.getId(), ts1, ts2);
                if (satOnline) {
                    lockSection(section.getId(), null, ts2);
                    addToDayLoad(section.getId(), null, ts2);
                } else {
                    lockSection(section.getId(), ts1, ts2);
                    addToDayLoad(section.getId(), ts1, ts2);
                }
                if (room != null) {
                    if (satOnline) {
                        lockRoom(room.getId(), null, ts2);
                    } else {
                        lockRoom(room.getId(), ts1, ts2);
                    }
                }

                Schedule schedule = Schedule.builder()
                        .subject(subject).room(room).teacher(teacher)
                        .timeslot(ts1).timeslot2(ts2).section(section)
                        .semester(semester).schoolYear(schoolYear)
                        .campus(room != null ? room.getCampus() : campus)
                        .sessionType(sessionType)
                        .isOnline(satOnline || fullyOnline)
                        .status(ScheduleStatus.DRAFT)
                        .build();

                Schedule saved = scheduleRepository.save(schedule);
                scheduleRepository.flush();
                log.warn("⚠ Fallback teacher used: {} for {} / {}",
                        teacher.getFullName(), subject.getCode(), section.getDisplayLabel());
                return saved;
            }
        }

        // ── Truly exhausted — this should never happen with enough resources ──
        log.error("✗ EXHAUSTED all combinations for {} / {}",
                subject.getCode(), section.getDisplayLabel());
        return saveConflict(subject, section, campus, semester, schoolYear,
                "No valid (teacher × timeslot × room) combination found for: "
                + subject.getCode());
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
    }

    private void lockSection(Long sectionId, Timeslot ts1, Timeslot ts2) {
        Set<Long> s = sectionLocks.computeIfAbsent(sectionId, k -> new HashSet<>());
        if (ts1 != null) {
            s.add(ts1.getId());
        }
        if (ts2 != null) {
            s.add(ts2.getId());
        }
    }

    private boolean isTeacherFree(Long teacherId, Timeslot ts1, Timeslot ts2) {
        Set<Long> locked = teacherLocks.getOrDefault(teacherId, Set.of());
        boolean ts1Free = ts1 == null || !locked.contains(ts1.getId());
        boolean ts2Free = ts2 == null || !locked.contains(ts2.getId());
        return ts1Free && ts2Free;
    }

    private boolean isRoomFree(Long roomId, Timeslot ts1, Timeslot ts2) {
        Set<Long> locked = roomLocks.getOrDefault(roomId, Set.of());
        // Saturday ts1 is online — room only needed for ts2
        return !locked.contains(ts1.getId()) && !locked.contains(ts2.getId());
    }

    private boolean isSectionFree(Long sectionId, Timeslot ts1, Timeslot ts2) {
        Set<Long> locked = sectionLocks.getOrDefault(sectionId, Set.of());
        boolean ts1Free = ts1 == null || !locked.contains(ts1.getId());
        boolean ts2Free = ts2 == null || !locked.contains(ts2.getId());
        return ts1Free && ts2Free;
    }

    private boolean isTeacherAvailable(Long teacherId, Timeslot ts1, Timeslot ts2) {
        Set<Long> unavail = teacherUnavailable.getOrDefault(teacherId, Set.of());
        boolean ts1Ok = ts1 == null || !unavail.contains(ts1.getId());
        boolean ts2Ok = ts2 == null || !unavail.contains(ts2.getId());
        return ts1Ok && ts2Ok;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Soft constraint tracking (day load per section)
    // ═════════════════════════════════════════════════════════════════════════
    /**
     * sectionId → dayOfWeek → list of slot numbers (for soft constraint checks)
     */
    private final Map<Long, Map<DayOfWeek, List<Short>>> sectionDaySlots = new HashMap<>();

    private void addToDayLoad(Long sectionId, Timeslot ts1, Timeslot ts2) {
        Map<DayOfWeek, List<Short>> dayMap
                = sectionDaySlots.computeIfAbsent(sectionId, k -> new HashMap<>());
        if (ts1 != null) {
            dayMap.computeIfAbsent(ts1.getDayOfWeek(), k -> new ArrayList<>())
                    .add(ts1.getSlotNumber());
        }
        if (ts2 != null) {
            dayMap.computeIfAbsent(ts2.getDayOfWeek(), k -> new ArrayList<>())
                    .add(ts2.getSlotNumber());
        }
    }

    /**
     * R4: after 2 classes on same day there must be a break. Returns true if
     * placing this timeslot would violate the break rule.
     */
    private boolean isAdjacentAfter2(Long sectionId, Timeslot ts,
            Semester semester, String schoolYear) {
        Map<DayOfWeek, List<Short>> dayMap = sectionDaySlots.getOrDefault(sectionId, Map.of());
        List<Short> slotsOnDay = dayMap.getOrDefault(ts.getDayOfWeek(), List.of());
        if (slotsOnDay.size() < 2) {
            return false; // rule only kicks in after 2 classes

                }short slotNum = ts.getSlotNumber();
        return slotsOnDay.stream().anyMatch(s -> Math.abs(s - slotNum) == 1);
    }

    /**
     * Returns true if placing this timeslot would create > 2 consecutive slots.
     */
    private boolean wouldExceedConsecutive(Long sectionId, Timeslot ts) {
        Map<DayOfWeek, List<Short>> dayMap = sectionDaySlots.getOrDefault(sectionId, Map.of());
        Set<Short> slotsOnDay = new HashSet<>(dayMap.getOrDefault(ts.getDayOfWeek(), List.of()));
        if (slotsOnDay.isEmpty()) {
            return false;
        }
        short slotNum = ts.getSlotNumber();
        int count = 1;
        for (short c = (short) (slotNum - 1); slotsOnDay.contains(c); c--) {
            count++;
        }
        for (short c = (short) (slotNum + 1); slotsOnDay.contains(c); c++) {
            count++;
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
    private List<TimeslotPair> buildTimeslotPairs(
            int reqDuration, boolean isLab, boolean preferSaturday,
            Set<DayOfWeek> excludeDays,
            Section section, Semester semester, String schoolYear) {

        List<Timeslot> candidates = allTimeslots.stream()
                .filter(ts -> ts.getDurationMinutes() == reqDuration)
                .filter(ts -> !excludeDays.contains(ts.getDayOfWeek()))
                .filter(ts -> !isLab || ts.getDayOfWeek() != DayOfWeek.SATURDAY) // R8
                .toList();

        List<TimeslotPair> result = new ArrayList<>();

        if (preferSaturday) {
            // R9/R10: Saturday ts1 + weekday ts2
            List<Timeslot> satSlots = candidates.stream()
                    .filter(ts -> ts.getDayOfWeek() == DayOfWeek.SATURDAY)
                    .toList();
            List<Timeslot> wdSlots = candidates.stream()
                    .filter(ts -> ts.getDayOfWeek() != DayOfWeek.SATURDAY)
                    .toList();
            for (Timeslot sat : satSlots) {
                for (Timeslot wd : wdSlots) {
                    result.add(new TimeslotPair(sat, wd));
                }
            }
        }

        // All distinct-day pairs (weekday × weekday)
        for (int i = 0; i < candidates.size(); i++) {
            for (int j = i + 1; j < candidates.size(); j++) {
                Timeslot a = candidates.get(i);
                Timeslot b = candidates.get(j);
                if (!a.getDayOfWeek().equals(b.getDayOfWeek())) {
                    // Skip Saturday pairs already added
                    if (preferSaturday && a.getDayOfWeek() == DayOfWeek.SATURDAY) {
                        continue;
                    }
                    result.add(new TimeslotPair(a, b));
                }
            }
        }

        return result;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // Teacher candidate builder
    // ═════════════════════════════════════════════════════════════════════════
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
                && "CPE".equals(subject.getDepartment().getCode());
        boolean isHardwareLab = isLabSession && isCPESubject;

        Long campusId = defaultCampus.getId();
        if (profile != null && profile.isGETeacher() && profile.getPreferredCampus() != null) {
            campusId = profile.getPreferredCampus().getId();
        }
        final Long targetCampusId = campusId;

        // Try target campus first, then any campus for GE teachers
        List<Room> pool = allRooms.stream()
                .filter(r -> r.getRoomType() == roomType)
                .filter(r -> r.getCapacity() >= minCapacity || r.getCapacity() >= 1)
                .toList();

        // Sort: target campus first
        pool = pool.stream()
                .sorted(Comparator.comparingInt(r
                        -> r.getCampus() != null && r.getCampus().getId().equals(targetCampusId) ? 0 : 1))
                .toList();

        for (Room r : pool) {
            // R7: room must be free at both timeslots
            Set<Long> locked = roomLocks.getOrDefault(r.getId(), Set.of());
            if (locked.contains(ts1Id) || locked.contains(ts2Id)) {
                continue;
            }

            String num = r.getRoomNumber();

            // R12: 305 — CPE hardware lab only
            if (ROOM_305_NUMBER.equals(num) && !isHardwareLab) {
                continue;
            }
            if (isHardwareLab && !ROOM_305_NUMBER.equals(num)) {
                continue;
            }

            // R12: 301–304 — computer labs, LAB sessions only
            if (COMPUTER_LAB_NUMBERS.contains(num) && !isLabSession) {
                continue;
            }

            // R12: 306 — major LECTURE only (not minor, not lab)
            if (ROOM_306_NUMBER.equals(num) && (isMinor || isLabSession)) {
                continue;
            }

            // R3: minor → must be 401–408; major → must NOT be 401–408
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
    private Schedule saveConflict(Subject subject, Section section, Campus campus,
            Semester semester, String schoolYear, String reason) {
        log.error("CONFLICT: {} / {} — {}", subject.getCode(), section.getDisplayLabel(), reason);
        Schedule s = scheduleRepository.save(Schedule.builder()
                .subject(subject).section(section)
                .semester(semester).schoolYear(schoolYear).campus(campus)
                .status(ScheduleStatus.CONFLICTED).build());
        scheduleRepository.flush();
        conflictLogService.log(s, ConflictLog.ConflictType.TEACHER_DOUBLE_BOOKED, reason);
        return s;
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
