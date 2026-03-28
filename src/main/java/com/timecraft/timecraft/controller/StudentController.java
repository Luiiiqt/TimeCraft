package com.timecraft.timecraft.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

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
import com.timecraft.timecraft.model.StudentProfile;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.service.StudentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    // ── GET /api/v1/students ──────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> findAll(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Short yearLevel,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) Boolean irregular) {

        List<User> students;

        if (Boolean.TRUE.equals(irregular)) {
            students = courseId != null
                    ? studentService.findIrregularByCourse(courseId)
                            .stream().map(StudentProfile::getUser).toList()
                    : studentService.findAllIrregular()
                            .stream().map(StudentProfile::getUser).toList();
        } else if (courseId != null && yearLevel != null && section != null) {
            students = studentService.findBySection(courseId, yearLevel, section)
                    .stream().map(StudentProfile::getUser).toList();
        } else if (courseId != null && yearLevel != null) {
            students = studentService.findByCourseAndYear(courseId, yearLevel)
                    .stream().map(StudentProfile::getUser).toList();
        } else if (courseId != null) {
            students = studentService.findByCourse(courseId)
                    .stream().map(StudentProfile::getUser).toList();
        } else {
            students = studentService.findAll();
        }

        return ResponseEntity.ok(ApiResponse.of(students));
    }

    // ── GET /api/v1/students/me ───────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<StudentProfile>> getMyProfile(
            Principal principal) {
        User user = studentService.findAll().stream()
                .filter(u -> u.getEmail().equals(principal.getName()))
                .findFirst()
                .orElseThrow();
        StudentProfile profile = studentService.findProfileByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.of(profile));
    }

    // ── GET /api/v1/students/{id} ─────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentProfile>> findById(
            @PathVariable Long id) {
        StudentProfile profile = studentService.findProfileByUserId(id);
        return ResponseEntity.ok(ApiResponse.of(profile));
    }

    // ── PUT /api/v1/students/{id}/promote ────────────────────────────────────

    @PutMapping("/{id}/promote")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> promote(@PathVariable Long id) {
        studentService.promoteYearLevel(id);
        return ResponseEntity.ok(
                ApiResponse.success("Student promoted to next year level"));
    }

    // ── PUT /api/v1/students/{id}/tag-irregular ───────────────────────────────

    @PutMapping("/{id}/tag-irregular")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> tagIrregular(
            @PathVariable Long id) {
        studentService.tagAsIrregular(id);
        return ResponseEntity.ok(
                ApiResponse.success("Student tagged as irregular"));
    }

    // ── PUT /api/v1/students/{id}/tag-regular ────────────────────────────────

    @PutMapping("/{id}/tag-regular")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> tagRegular(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        studentService.tagAsRegular(id, body.get("section"));
        return ResponseEntity.ok(
                ApiResponse.success("Student tagged as regular"));
    }
}