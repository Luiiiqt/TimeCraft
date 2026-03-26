package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.DuplicateResourceException;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.Department;
import com.timecraft.timecraft.model.StudentProfile;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.DepartmentRepository;
import com.timecraft.timecraft.repository.StudentProfileRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student not found with id: " + id));
    }

    public StudentProfile findProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student profile not found for user id: " + userId));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<User> findAll() {
        return userRepository.findByUserTypeAndIsActiveTrue(UserType.STUDENT);
    }

    public List<StudentProfile> findByCourse(Long courseId) {
        return profileRepository.findByCourseId(courseId);
    }

    public List<StudentProfile> findByCourseAndYear(Long courseId,
            Short yearLevel) {
        return profileRepository.findByCourseIdAndYearLevel(courseId, yearLevel);
    }

    public List<StudentProfile> findBySection(Long courseId, Short yearLevel,
            String section) {
        return profileRepository.findByCourseIdAndYearLevelAndSection(
                courseId, yearLevel, section);
    }

    public List<StudentProfile> findAllIrregular() {
        return profileRepository.findByIsIrregularTrue();
    }

    public List<StudentProfile> findIrregularByCourse(Long courseId) {
        return profileRepository.findByCourseIdAndIsIrregularTrue(courseId);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public User createStudent(String fullName, String schoolId, String email,
            String rawPassword, Long departmentId, Long courseId,
            Short yearLevel, String section,
            boolean isIrregular) {

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already in use: " + email);
        }
        if (userRepository.existsBySchoolId(schoolId)) {
            throw new DuplicateResourceException(
                    "School ID already in use: " + schoolId);
        }

        // Validate irregular constraint: irregular = no section
        if (isIrregular && section != null) {
            throw new IllegalArgumentException(
                    "Irregular students must not have a section assigned");
        }
        if (!isIrregular && section == null) {
            throw new IllegalArgumentException(
                    "Regular students must have a section assigned");
        }

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found: " + departmentId));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course not found: " + courseId));

        User user = User.builder()
                .userType(UserType.STUDENT)
                .fullName(fullName)
                .schoolId(schoolId)
                .email(email)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .isActive(true)
                .build();
        userRepository.save(user);

        StudentProfile profile = StudentProfile.builder()
                .user(user)
                .department(department)
                .course(course)
                .yearLevel(yearLevel)
                .section(section)
                .isIrregular(isIrregular)
                .build();
        profileRepository.save(profile);

        return user;
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public StudentProfile promoteYearLevel(Long studentId) {
        StudentProfile profile = findProfileByUserId(studentId);
        if (profile.getYearLevel() >= profile.getCourse().getYearsDuration()) {
            throw new IllegalStateException(
                    "Student is already at the maximum year level");
        }
        profile.setYearLevel((short) (profile.getYearLevel() + 1));
        return profileRepository.save(profile);
    }

    @Transactional
    public StudentProfile tagAsIrregular(Long studentId) {
        StudentProfile profile = findProfileByUserId(studentId);
        profile.setIrregular(true);
        profile.setSection(null);
        return profileRepository.save(profile);
    }

    @Transactional
    public StudentProfile tagAsRegular(Long studentId, String section) {
        if (section == null || section.isBlank()) {
            throw new IllegalArgumentException(
                    "Section is required when tagging a student as regular");
        }
        StudentProfile profile = findProfileByUserId(studentId);
        profile.setIrregular(false);
        profile.setSection(section);
        return profileRepository.save(profile);
    }
}