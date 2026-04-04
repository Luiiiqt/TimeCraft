package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.DuplicateResourceException;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + id));
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with email: " + email));
    }

    public User findBySchoolId(String schoolId) {
        return userRepository.findBySchoolId(schoolId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with school ID: " + schoolId));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<User> findAllStudents() {
        return userRepository.findByUserTypeAndIsActiveTrue(UserType.STUDENT);
    }

    public List<User> findAllTeachers() {
        return userRepository.findByUserTypeAndIsActiveTrue(UserType.TEACHER);
    }

    public List<User> searchByName(UserType type, String name) {
        return userRepository.searchByTypeAndName(type, name);
    }

    // ── Validation ────────────────────────────────────────────────────────────

    @Transactional
    public void validateNewUser(String email, String schoolId) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException(
                    "Email already in use: " + email);
        }
        if (userRepository.existsBySchoolId(schoolId)) {
            throw new DuplicateResourceException(
                    "School ID already in use: " + schoolId);
        }
    }

    // ── Password ──────────────────────────────────────────────────────────────

    @Transactional
    public void changePassword(Long userId, String currentPassword,
            String newPassword) {
        User user = findById(userId);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public String encodePassword(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    // ── Teacher creation (Admin) ──────────────────────────────────────────────

    @Transactional
    public User createTeacher(String fullName, String email, String schoolId,
            Long departmentId, boolean isGETeacher,
            com.timecraft.timecraft.repository.DepartmentRepository departmentRepo,
            com.timecraft.timecraft.repository.TeacherProfileRepository teacherProfileRepo) {
        validateNewUser(email, schoolId);

        User user = userRepository.save(User.builder()
                .fullName(fullName)
                .email(email)
                .schoolId(schoolId)
                .passwordHash(passwordEncoder.encode(schoolId)) // default password = schoolId
                .userType(UserType.TEACHER)
                .isActive(true)
                .build());

        com.timecraft.timecraft.model.Department dept = departmentRepo.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found: " + departmentId));

        com.timecraft.timecraft.model.TeacherProfile profile =
                com.timecraft.timecraft.model.TeacherProfile.builder()
                        .user(user)
                        .department(dept)
                        .campusFlexible(isGETeacher)
                        .build();
        teacherProfileRepo.save(profile);
        return user;
    }

    // ── Delete all teachers (Admin reset) ─────────────────────────────────────

    @Transactional
    public void deleteAllTeachers() {
        List<User> teachers = userRepository.findByUserTypeAndIsActiveTrue(UserType.TEACHER);
        teachers.forEach(t -> t.setActive(false));
        userRepository.saveAll(teachers);
    }

    // ── Deactivate ────────────────────────────────────────────────────────────

    @Transactional
    public void deactivate(Long userId) {
        User user = findById(userId);
        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional
    public void activate(Long userId) {
        User user = findById(userId);
        user.setActive(true);
        userRepository.save(user);
    }
}