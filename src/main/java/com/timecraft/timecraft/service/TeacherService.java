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
    private final TeacherAvailabilityRepository      availabilityRepository;
    private final TimeslotRepository                 timeslotRepository;
    private final TeacherSubjectPreferenceRepository subjectPreferenceRepository;
    private final SubjectRepository                  subjectRepository;

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
                        teacherId, semester, schoolYear);
    }

    @Transactional
    public void saveSubjectPreferences(Long teacherId,
            List<Long> subjectIds, String semester, String schoolYear) {

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Teacher not found: " + teacherId));

        for (Long subjectId : subjectIds) {
            boolean exists = subjectPreferenceRepository
                    .findByTeacherIdAndSubjectIdAndSemesterAndSchoolYear(
                            teacherId, subjectId, semester, schoolYear)
                    .isPresent();
            if (!exists) {
                Subject subject = subjectRepository.findById(subjectId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Subject not found: " + subjectId));
                subjectPreferenceRepository.save(
                        TeacherSubjectPreference.builder()
                                .teacher(teacher)
                                .subject(subject)
                                .semester(semester)
                                .schoolYear(schoolYear)
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
            row.put("available",  availMap.getOrDefault(ts.getId(), false));

            Map<String, Object> tsMap = new HashMap<>();
            tsMap.put("id",         ts.getId());
            tsMap.put("dayOfWeek",  ts.getDayOfWeek());
            tsMap.put("slotNumber", ts.getSlotNumber());
            tsMap.put("startTime",  ts.getStartTime().toString());
            tsMap.put("endTime",    ts.getEndTime().toString());
            tsMap.put("label",      ts.getLabel());
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

    // ── Deactivate ────────────────────────────────────────────────────────────

    @Transactional
    public void deactivate(Long teacherId) {
        User teacher = findById(teacherId);
        teacher.setActive(false);
        userRepository.save(teacher);
    }
}