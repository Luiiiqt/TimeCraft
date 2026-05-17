package com.timecraft.timecraft.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final com.timecraft.timecraft.repository.DeanProfileRepository deanProfileRepository;
    private final com.timecraft.timecraft.repository.TeacherProfileRepository teacherProfileRepository;
    private final com.timecraft.timecraft.repository.StudentProfileRepository studentProfileRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> getByRole(
            @RequestParam(required = false) String role) {
        List<User> users = role == null
                ? userService.findAll()
                : userService.findByUserTypeAndIsActiveTrue(UserType.valueOf(role));

        List<java.util.Map<String, Object>> result = users.stream().map(u -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id",       u.getId());
            m.put("fullName", u.getFullName());
            m.put("email",    u.getEmail());
            m.put("schoolId", u.getSchoolId());
            m.put("role",     u.getUserType() != null ? u.getUserType().name() : null);

            // Department
            String deptName = null;
            Long   deptId   = null;
            if (u.getUserType() == UserType.DEAN || u.getUserType() == UserType.PROGRAM_HEAD) {
                var profile = deanProfileRepository.findByUserId(u.getId()).orElse(null);
                if (profile != null && profile.getDepartment() != null) {
                    deptName = profile.getDepartment().getName();
                    deptId   = profile.getDepartment().getId();
                }
            } else if (u.getUserType() == UserType.TEACHER) {
                var profile = teacherProfileRepository.findByUserId(u.getId()).orElse(null);
                if (profile != null && profile.getDepartment() != null) {
                    deptName = profile.getDepartment().getName();
                    deptId   = profile.getDepartment().getId();
                }
            }
            m.put("departmentId",   deptId);
            m.put("departmentName", deptName);
            m.put("department",     deptName != null ? java.util.Map.of("id", deptId, "name", deptName) : null);

            // Course (for students/program heads)
            if (u.getUserType() == UserType.STUDENT) {
                var profile = studentProfileRepository.findByUserId(u.getId()).orElse(null);
                if (profile != null && profile.getCourse() != null) {
                    m.put("course", java.util.Map.of(
                        "id",   profile.getCourse().getId(),
                        "name", profile.getCourse().getName(),
                        "code", profile.getCourse().getCode()));
                }
            }
            return m;
        }).toList();

        return ResponseEntity.ok(ApiResponse.success("OK", result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateUser(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body) {
        userService.updateUser(id, body);
        return ResponseEntity.ok(ApiResponse.success("Updated"));
    }
}