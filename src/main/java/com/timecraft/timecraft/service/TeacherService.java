package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.DuplicateResourceException;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Campus;
import com.timecraft.timecraft.model.Department;
import com.timecraft.timecraft.model.Teacher;
import com.timecraft.timecraft.model.TeacherProfile;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.repository.CampusRepository;
import com.timecraft.timecraft.repository.DepartmentRepository;
import com.timecraft.timecraft.repository.TeacherProfileRepository;
import com.timecraft.timecraft.repository.TeacherRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final TeacherProfileRepository teacherProfileRepository;

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final CampusRepository campusRepository;

    private final PasswordEncoder passwordEncoder;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public Teacher findById(Long id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Teacher not found with id: " + id));
    }

    public Teacher findByEmail(String email) {
        return teacherRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Teacher not found with email: " + email));
    }

    public Teacher findBySchoolId(String schoolId) {
        return teacherRepository.findBySchoolId(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Teacher not found with school ID: " + schoolId));
    }

    public TeacherProfile findProfileByUserId(Long userId) {
        return teacherProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Teacher profile not found for user id: " + userId));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<Teacher> findAll() {
        return teacherRepository.findByIsActiveTrue();
    }

    public List<Teacher> findByDepartment(Long departmentId) {
        return teacherRepository.findActiveByDepartmentId(departmentId);
    }

    public List<Teacher> findAllCampusFlexible() {
        return teacherRepository.findAllCampusFlexible();
    }

    public List<Teacher> searchByName(String name) {
        return teacherRepository.searchByName(name);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public Teacher createTeacher(String fullName, String schoolId, String email,
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

        // 3. Return as Teacher view (same row, different entity mapping)
        return teacherRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Failed to reload teacher after creation"));
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

    // ── Deactivate ────────────────────────────────────────────────────────────

    @Transactional
    public void deactivate(Long teacherId) {
        Teacher teacher = findById(teacherId);
        teacher.setActive(false);
        teacherRepository.save(teacher);
    }
}