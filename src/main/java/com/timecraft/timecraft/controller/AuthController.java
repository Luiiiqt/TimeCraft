package com.timecraft.timecraft.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.request.LoginRequest;
import com.timecraft.timecraft.dto.request.RegisterRequest;
import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.dto.response.AuthResponse;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.service.AuthService;
import com.timecraft.timecraft.service.StudentService;
import com.timecraft.timecraft.service.TeacherService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService    authService;
    private final StudentService studentService;
    private final TeacherService teacherService;

    // ── POST /api/v1/auth/login ───────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        Map<String, Object> claims = authService.login(
                request.getEmail(), request.getPassword());

        AuthResponse authResponse = mapClaimsToAuthResponse(claims);

        return ResponseEntity.ok(
                ApiResponse.success("Login successful", authResponse));
    }

    // ── POST /api/v1/auth/register ────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(
            @Valid @RequestBody RegisterRequest request) {

        if (request.getUserType() == UserType.STUDENT) {
            studentService.createStudent(
                    request.getFullName(),
                    request.getSchoolId(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getDepartmentId(),   // nullable — derived from course
                    request.getCourseId(),
                    request.getYearLevel() != null ? request.getYearLevel() : 1,
                    request.getSection(),        // nullable — auto irregular
                    request.isIrregular());
        } else {
            teacherService.createTeacher(
                    request.getFullName(),
                    request.getSchoolId(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getDepartmentId(),
                    request.isCampusFlexible(),
                    request.getPreferredCampusId());
        }

        return ResponseEntity.ok(
                ApiResponse.success("Registration successful"));
    }

    // ── GET /api/v1/auth/me ───────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> me(Principal principal) {
        Map<String, Object> claims = authService.getProfile(principal.getName());
        AuthResponse authResponse = mapClaimsToAuthResponse(claims);
        return ResponseEntity.ok(ApiResponse.of(authResponse));
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private AuthResponse mapClaimsToAuthResponse(Map<String, Object> claims) {
        AuthResponse.AuthResponseBuilder builder = AuthResponse.builder()
                .token((String) claims.get("token"))
                .userId(toLong(claims.get("userId")))
                .email((String) claims.get("email"))
                .schoolId((String) claims.get("schoolId"))
                .fullName((String) claims.get("fullName"))
                .role((String) claims.get("role"))
                .departmentId(toLong(claims.get("departmentId")))
                .departmentName((String) claims.get("departmentName"));

        String role = (String) claims.get("role");

        if ("STUDENT".equals(role)) {
            builder
                .courseId(toLong(claims.get("courseId")))
                .courseCode((String) claims.get("courseCode"))
                .courseName((String) claims.get("courseName"))
                .yearLevel(toShort(claims.get("yearLevel")))
                .section((String) claims.get("section"))
                .sectionId(toLong(claims.get("sectionId")))
                .isIrregular((Boolean) claims.get("isIrregular"));
        } else if ("TEACHER".equals(role)) {
            builder
                .campusFlexible((Boolean) claims.get("campusFlexible"))
                .preferredCampusId(toLong(claims.get("preferredCampusId")))
                .preferredCampusCode((String) claims.get("preferredCampusCode"));
        }

        return builder.build();
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Long l) return l;
        if (value instanceof Integer i) return i.longValue();
        return Long.valueOf(value.toString());
    }

    private Short toShort(Object value) {
        if (value == null) return null;
        if (value instanceof Short s) return s;
        if (value instanceof Integer i) return i.shortValue();
        return Short.valueOf(value.toString());
    }
}