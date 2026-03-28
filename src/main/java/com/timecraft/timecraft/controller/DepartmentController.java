package com.timecraft.timecraft.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.Department;
import com.timecraft.timecraft.service.DepartmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    // ── GET /api/v1/departments ───────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> findAll() {
        return ResponseEntity.ok(
                ApiResponse.of(departmentService.findAllActive()));
    }

    // ── GET /api/v1/departments/{id} ──────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> findById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.of(departmentService.findById(id)));
    }

    // ── GET /api/v1/departments/{id}/courses ──────────────────────────────────

    @GetMapping("/{id}/courses")
    public ResponseEntity<ApiResponse<List<Course>>> findCourses(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.of(departmentService.findCoursesByDepartment(id)));
    }

    // ── POST /api/v1/departments ──────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Department>> create(
            @RequestBody Map<String, String> body) {
        Department dept = departmentService.create(
                body.get("name"), body.get("code"));
        return ResponseEntity.ok(
                ApiResponse.success("Department created", dept));
    }

    // ── PUT /api/v1/departments/{id}/deactivate ───────────────────────────────

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        departmentService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Department deactivated"));
    }
}