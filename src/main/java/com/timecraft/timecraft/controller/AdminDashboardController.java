package com.timecraft.timecraft.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.repository.ConflictLogRepository;
import com.timecraft.timecraft.repository.DepartmentRepository;
import com.timecraft.timecraft.repository.RoomRepository;
import com.timecraft.timecraft.repository.SectionRepository;
import com.timecraft.timecraft.repository.TeacherProfileRepository;
import com.timecraft.timecraft.repository.UserRepository;
import com.timecraft.timecraft.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final RoomRepository roomRepository;
    private final ConflictLogRepository conflictLogRepository;
    private final UserService userService;
    private final DepartmentRepository departmentRepository;
    private final TeacherProfileRepository teacherProfileRepository;
private final com.timecraft.timecraft.repository.DeanProfileRepository programHeadProfileRepository;
private final com.timecraft.timecraft.repository.DeanCourseRepository programHeadCourseRepository;
private final com.timecraft.timecraft.repository.CourseRepository courseRepository;

    @PostMapping("/deans")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createDean(
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        java.util.List<Long> courseIds = ((java.util.List<?>) body.get("courseIds"))
                .stream().map(o -> Long.valueOf(o.toString())).toList();
        User.UserType userType = body.containsKey("userType")
                ? User.UserType.valueOf(body.get("userType").toString())
                : User.UserType.DEAN;
        User user = userService.createProgramHead(
                body.get("fullName").toString(),
                body.get("email").toString(),
                body.get("schoolId").toString(),
                Long.valueOf(body.get("departmentId").toString()),
                courseIds, userType,
                departmentRepository,
                programHeadProfileRepository,
                programHeadCourseRepository,
                courseRepository);
        return ResponseEntity.ok(ApiResponse.success("Dean registered",
                Map.of("id", user.getId(), "name", user.getFullName())));
    }

@PostMapping("/teachers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTeacher(
            @RequestBody Map<String, Object> body) {
        User user = userService.createTeacher(
                body.get("fullName").toString(),
                body.get("email").toString(),
                body.get("schoolId").toString(),
                Long.valueOf(body.get("departmentId").toString()),
                Boolean.parseBoolean(body.getOrDefault("isGETeacher", false).toString()),
                departmentRepository,
                teacherProfileRepository);
        return ResponseEntity.ok(ApiResponse.success("Teacher registered",
                Map.of("id", user.getId(), "name", user.getFullName())));
    }

    @DeleteMapping("/teachers/reset")
    public ResponseEntity<ApiResponse<Void>> resetTeachers() {
        userService.deleteAllTeachers();
        return ResponseEntity.ok(ApiResponse.success("All teachers deactivated"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.of(Map.of(
                "totalStudents",        userRepository.findByUserTypeAndIsActiveTrue(UserType.STUDENT).size(),
                "totalTeachers",        userRepository.findByUserTypeAndIsActiveTrue(UserType.TEACHER).size(),
                "totalSections",        sectionRepository.findByIsActiveTrue().size(),
                "totalRooms",           roomRepository.findAll().size(),
                "unresolvedConflicts",  conflictLogRepository.countByResolvedFalse()
        )));
    }
}