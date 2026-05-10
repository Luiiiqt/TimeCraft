package com.timecraft.timecraft.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.DuplicateResourceException;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Campus;
import com.timecraft.timecraft.model.Department;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.TeacherAvailability;
import com.timecraft.timecraft.model.TeacherProfile;
import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.model.Timeslot;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.repository.CampusRepository;
import com.timecraft.timecraft.repository.DepartmentRepository;
import com.timecraft.timecraft.repository.SubjectRepository;
import com.timecraft.timecraft.repository.TeacherAvailabilityRepository;
import com.timecraft.timecraft.repository.TeacherProfileRepository;
import com.timecraft.timecraft.repository.TeacherSubjectPreferenceRepository;
import com.timecraft.timecraft.repository.TimeslotRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherService {

    private final TeacherProfileRepository teacherProfileRepository;

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CampusRepository campusRepository;

    private final PasswordEncoder passwordEncoder;
    private final TeacherAvailabilityRepository availabilityRepository;
    private final TimeslotRepository timeslotRepository;
    private final TeacherSubjectPreferenceRepository subjectPreferenceRepository;
    private final SubjectRepository subjectRepository;
    private final com.timecraft.timecraft.repository.CourseSubjectRepository courseSubjectRepository;

    // ── Lookup ────────────────────────────────────────────────────────────────
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Teacher not found with id: " + id));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Teacher not found with email: " + email));
    }

    public User findBySchoolId(String schoolId) {
        return userRepository.findBySchoolId(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Teacher not found with school ID: " + schoolId));
    }

    public TeacherProfile findProfileByUserId(Long userId) {
        return teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Teacher profile not found for user id: " + userId));
    }

    // ── List ──────────────────────────────────────────────────────────────────
    public List<User> findAll() {
        return userRepository.findByUserTypeAndIsActiveTrue(UserType.TEACHER);
    }

    public List<User> findByDepartment(Long departmentId) {
        return teacherProfileRepository.findByDepartmentId(departmentId)
                .stream()
                .map(TeacherProfile::getUser)
                .toList();
    }

    public List<User> findAllCampusFlexible() {
        return teacherProfileRepository.findByCampusFlexibleTrue()
                .stream()
                .map(TeacherProfile::getUser)
                .toList();
    }

    public List<User> searchByName(String name) {
        return userRepository.searchByTypeAndName(UserType.TEACHER, name);
    }

    // ── Create ────────────────────────────────────────────────────────────────
    @Transactional
    public User createTeacher(String fullName, String schoolId, String email,
            String rawPassword, Long departmentId,
            boolean campusFlexible, Long preferredCampusId) {

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already in use: " + email);
        }
        if (userRepository.existsBySchoolId(schoolId)) {
            throw new DuplicateResourceException(
                    "School ID already in use: " + schoolId);
        }

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Department not found: " + departmentId));

        // 1. Save base User row
        User user = User.builder()
                .userType(UserType.TEACHER)
                .fullName(fullName)
                .schoolId(schoolId)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .isActive(true)
                .build();
        userRepository.save(user);

        // 2. Build and save TeacherProfile
        TeacherProfile.TeacherProfileBuilder profileBuilder = TeacherProfile.builder()
                .user(user)
                .department(department)
                .campusFlexible(campusFlexible);

        if (campusFlexible && preferredCampusId != null) {
            Campus preferredCampus = campusRepository.findById(preferredCampusId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                    "Campus not found: " + preferredCampusId));
            profileBuilder.preferredCampus(preferredCampus);
        }

        teacherProfileRepository.save(profileBuilder.build());

        return user;
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @Transactional
    public TeacherProfile updateDepartment(Long teacherId, Long departmentId) {
        TeacherProfile profile = findProfileByUserId(teacherId);
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Department not found: " + departmentId));

        // GEN_ED department automatically makes teacher campus-flexible
        boolean isGenEd = "GEN_ED".equals(dept.getCode());
        profile.setDepartment(dept);
        profile.setCampusFlexible(isGenEd);

        return teacherProfileRepository.save(profile);
    }

    @Transactional
    public TeacherProfile updateCampusFlexibility(Long teacherId,
            boolean flexible,
            Long preferredCampusId) {
        TeacherProfile profile = findProfileByUserId(teacherId);
        profile.setCampusFlexible(flexible);

        if (flexible && preferredCampusId != null) {
            Campus campus = campusRepository.findById(preferredCampusId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                    "Campus not found: " + preferredCampusId));
            profile.setPreferredCampus(campus);
        } else {
            profile.setPreferredCampus(null);
        }

        return teacherProfileRepository.save(profile);
    }

    // ── Subject preferences ───────────────────────────────────────────────────
    public List<TeacherSubjectPreference> getSubjectPreferences(
            Long teacherId, String semester, String schoolYear) {
        return subjectPreferenceRepository
                .findByTeacherIdAndSemesterAndSchoolYear(
                        teacherId,
                        com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester),
                        schoolYear);
    }

    @Transactional
    public void saveSubjectPreferences(Long teacherId,
            List<Long> subjectIds, String semester, String schoolYear,
            String vacantDay, String vacantTime) {

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Teacher not found: " + teacherId));

        // Delete existing preferences for this teacher+schoolYear so re-save is clean
        com.timecraft.timecraft.model.CourseSubject.Semester semesterEnum
                = com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester);
// No full delete — upsert below handles individual subjects
        TeacherProfile profile = teacherProfileRepository.findByUserId(teacherId)
                .orElse(null);
        Long departmentId = profile != null && profile.getDepartment() != null
                ? profile.getDepartment().getId() : null;

        for (Long subjectId : subjectIds) {
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                    "Subject not found: " + subjectId));

            List<com.timecraft.timecraft.model.CourseSubject> courseSubjects
                    = courseSubjectRepository.findBySubjectId(subjectId);

            // Always use the semester the teacher explicitly selected
            com.timecraft.timecraft.model.CourseSubject.Semester actualSemester
                    = com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester);

            // Resolve course — prefer one matching teacher's department
            com.timecraft.timecraft.model.Course resolvedCourse = courseSubjects.stream()
                    .filter(cs -> departmentId != null
                    && cs.getCourse().getDepartment() != null
                    && cs.getCourse().getDepartment().getId().equals(departmentId))
                    .findFirst()
                    .map(cs -> cs.getCourse())
                    .orElse(courseSubjects.isEmpty() ? null : courseSubjects.get(0).getCourse());

            TeacherSubjectPreference existing = subjectPreferenceRepository
                    .findByTeacherIdAndSubjectIdAndSemesterAndSchoolYear(
                            teacherId, subjectId, actualSemester, schoolYear)
                    .orElse(null);

            if (existing != null) {
                existing.setVacantDay(vacantDay);
                existing.setVacantTime(vacantTime);
                subjectPreferenceRepository.save(existing);
            } else {
                subjectPreferenceRepository.save(
                        TeacherSubjectPreference.builder()
                                .teacher(teacher)
                                .subject(subject)
                                .course(resolvedCourse)
                                .semester(actualSemester)
                                .schoolYear(schoolYear)
                                .vacantDay(vacantDay)
                                .vacantTime(vacantTime)
                                .build());
            }
        }
    }

    // ── Availability ──────────────────────────────────────────────────────────
    public List<Map<String, Object>> getAvailability(Long teacherId) {
        // Load all timeslots
        List<Timeslot> allSlots = timeslotRepository
                .findAllByOrderByDayOfWeekAscSlotNumberAsc();

        // Load teacher's saved availability
        List<TeacherAvailability> saved = availabilityRepository
                .findByTeacherId(teacherId);

        // Build a map of timeslotId → available
        Map<Long, Boolean> availMap = new HashMap<>();
        saved.forEach(a -> availMap.put(a.getTimeslot().getId(), a.isAvailable()));

        // Return all timeslots with available flag
        List<Map<String, Object>> result = new ArrayList<>();
        for (Timeslot ts : allSlots) {
            Map<String, Object> row = new HashMap<>();
            row.put("timeslotId", ts.getId());
            row.put("available", availMap.getOrDefault(ts.getId(), false));

            Map<String, Object> tsMap = new HashMap<>();
            tsMap.put("id", ts.getId());
            tsMap.put("dayOfWeek", ts.getDayOfWeek());
            tsMap.put("slotNumber", ts.getSlotNumber());
            tsMap.put("startTime", ts.getStartTime().toString());
            tsMap.put("endTime", ts.getEndTime().toString());
            tsMap.put("label", ts.getLabel());
            row.put("timeslot", tsMap);

            result.add(row);
        }
        return result;
    }

    @Transactional
    public void saveAvailability(Long teacherId, List<Long> availableTimeslotIds) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                "Teacher not found: " + teacherId));

        // Delete all existing availability for this teacher
        availabilityRepository.deleteByTeacherId(teacherId);
        availabilityRepository.flush();

        // Re-insert all timeslots — available=true only for selected IDs
        List<Timeslot> allSlots = timeslotRepository
                .findAllByOrderByDayOfWeekAscSlotNumberAsc();

        List<TeacherAvailability> records = new ArrayList<>();
        for (Timeslot ts : allSlots) {
            boolean isAvailable = availableTimeslotIds != null
                    && availableTimeslotIds.contains(ts.getId());
            records.add(TeacherAvailability.builder()
                    .teacher(teacher)
                    .timeslot(ts)
                    .available(isAvailable)
                    .build());
        }
        availabilityRepository.saveAll(records);
    }

    // ── Available subjects ────────────────────────────────────────────────────
    /**
     * Returns subjects a teacher can vote on. GE teachers (campusFlexible /
     * GEN_ED dept) → only MINOR subjects. Department teachers → only MAJOR
     * subjects in their own department. Teachers cannot see or vote on subjects
     * from other departments.
     */
    public List<Map<String, Object>> getAvailableSubjects(Long teacherId, String semester) {
        TeacherProfile profile = findProfileByUserId(teacherId);
        com.timecraft.timecraft.model.CourseSubject.Semester semesterEnum
                = semester != null
                        ? com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester)
                        : null;

        if (profile.isGETeacher()) {
            return subjectRepository.findByIsActiveTrue().stream()
                    .filter(s -> s.getSubjectType() == Subject.SubjectType.MINOR)
                    .filter(s -> !s.getCourseSubjects().isEmpty())
                    .filter(s -> semesterEnum == null || s.getCourseSubjects().stream()
                    .anyMatch(cs -> cs.getSemester() == semesterEnum))
                    .flatMap(s -> enrichAllYearLevels(s, semesterEnum).stream())
                    .toList();
        }

        Long departmentId = profile.getDepartment().getId();
        return subjectRepository.findByCourseDepartmentId(departmentId)
                .stream()
                .filter(s -> s.getSubjectType() == Subject.SubjectType.MAJOR)
                .filter(s -> semesterEnum == null || s.getCourseSubjects().stream()
                .anyMatch(cs -> cs.getSemester() == semesterEnum))
                .flatMap(s -> enrichAllYearLevels(s, semesterEnum).stream())
                .toList();
    }

    private List<java.util.Map<String, Object>> enrichAllYearLevels(Subject subject,
            com.timecraft.timecraft.model.CourseSubject.Semester semesterEnum) {
        List<java.util.Map<String, Object>> results = new java.util.ArrayList<>();
        subject.getCourseSubjects().stream()
                .filter(cs -> semesterEnum == null || cs.getSemester() == semesterEnum)
                .forEach(cs -> {
                    java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("id", subject.getId());
                    map.put("name", subject.getName());
                    map.put("code", subject.getCode());
                    map.put("units", subject.getUnits());
                    map.put("hasLab", subject.isHasLab());
                    map.put("subjectType", subject.getSubjectType());
                    map.put("sessionType", subject.getSessionType());
                    map.put("isActive", subject.isActive());
                    map.put("yearLevel", cs.getYearLevel());
                    map.put("semester", cs.getSemester());
                    map.put("courseId", cs.getCourse().getId());
                    map.put("courseCode", cs.getCourse().getCode());
                    map.put("courseName", cs.getCourse().getName());
                    results.add(map);
                });
        return results;
    }

    // ── Enrich subject with year level ────────────────────────────────────────────
    private java.util.Map<String, Object> enrichWithYearLevel(Subject subject,
            com.timecraft.timecraft.model.CourseSubject.Semester semesterEnum) {
        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", subject.getId());
        map.put("name", subject.getName());
        map.put("code", subject.getCode());
        map.put("units", subject.getUnits());
        map.put("hasLab", subject.isHasLab());
        map.put("subjectType", subject.getSubjectType());
        map.put("sessionType", subject.getSessionType());
        map.put("isActive", subject.isActive());
        subject.getCourseSubjects().stream()
                .filter(cs -> semesterEnum == null || cs.getSemester() == semesterEnum)
                .findFirst().ifPresent(cs -> {
                    map.put("yearLevel", cs.getYearLevel());
                    map.put("semester", cs.getSemester());
                    map.put("courseId", cs.getCourse().getId());
                    map.put("courseCode", cs.getCourse().getCode());
                    map.put("courseName", cs.getCourse().getName());
                });
        return map;
    }

    // ── Deactivate ────────────────────────────────────────────────────────────────
    @Transactional
    public void deactivate(Long teacherId) {
        User teacher = findById(teacherId);
        teacher.setActive(false);
        userRepository.save(teacher);
    }
}
