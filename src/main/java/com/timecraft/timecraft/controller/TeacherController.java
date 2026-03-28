package com.timecraft.timecraft.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.Teacher;
import com.timecraft.timecraft.model.TeacherAvailability;
import com.timecraft.timecraft.service.TeacherService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    // ── GET /api/v1/teachers ──────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Teacher>>> findAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long departmentId) {

        List<Teacher> teachers;
        if (name != null && !name.isBlank()) {
            teachers = teacherService.searchByName(name);
        } else if (departmentId != null) {
            teachers = teacherService.findByDepartment(departmentId);
        } else {
            teachers = teacherService.findAll();
        }

        return ResponseEntity.ok(ApiResponse.of(teachers));
    }

    // ── GET /api/v1/teachers/flexible ────────────────────────────────────────

    @GetMapping("/flexible")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Teacher>>> findFlexible() {
        return ResponseEntity.ok(
                ApiResponse.of(teacherService.findAllCampusFlexible()));
    }

    // ── GET /api/v1/teachers/me ───────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Teacher>> getMyProfile(Principal principal) {
        Teacher teacher = teacherService.findByEmail(principal.getName());
        return ResponseEntity.ok(ApiResponse.of(teacher));
    }

    // ── GET /api/v1/teachers/{id} ─────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Teacher>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(teacherService.findById(id)));
    }

    // ── PUT /api/v1/teachers/{id}/department ──────────────────────────────────

    @PutMapping("/{id}/department")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateDepartment(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {

        teacherService.updateDepartment(id, body.get("departmentId"));
        return ResponseEntity.ok(ApiResponse.success("Department updated"));
    }

    // ── PUT /api/v1/teachers/{id}/campus-flexibility ──────────────────────────

    @PutMapping("/{id}/campus-flexibility")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateCampusFlexibility(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        boolean flexible = Boolean.TRUE.equals(body.get("campusFlexible"));
        Long preferredCampusId = body.get("preferredCampusId") != null
                ? Long.valueOf(body.get("preferredCampusId").toString()) : null;

        teacherService.updateCampusFlexibility(id, flexible, preferredCampusId);
        return ResponseEntity.ok(
                ApiResponse.success("Campus flexibility updated"));
    }

    // ── GET /api/v1/teachers/{id}/availability ────────────────────────────────

    @GetMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<TeacherAvailability>>> getAvailability(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.of(teacherService.getAvailability(id)));
    }

    // ── PUT /api/v1/teachers/{id}/availability ────────────────────────────────

    @PutMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> saveAvailability(
            @PathVariable Long id,
            @RequestBody Map<String, List<Long>> body) {

        teacherService.saveAvailability(id, body.get("availableTimeslotIds"));
        return ResponseEntity.ok(ApiResponse.success("Availability saved"));
    }

    // ── DELETE /api/v1/teachers/{id} ─────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        teacherService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Teacher deactivated"));
    }
}