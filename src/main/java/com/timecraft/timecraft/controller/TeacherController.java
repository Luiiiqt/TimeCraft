package com.timecraft.timecraft.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.service.TeacherService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    // ── GET /api/v1/teachers ──────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','DEAN','PROGRAM_HEAD')")
    public ResponseEntity<ApiResponse<List<User>>> findAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long departmentId) {

        List<User> teachers;
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
    public ResponseEntity<ApiResponse<List<User>>> findFlexible() {
        return ResponseEntity.ok(
                ApiResponse.of(teacherService.findAllCampusFlexible()));
    }

    // ── GET /api/v1/teachers/me ───────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<User>> getMyProfile(Principal principal) {
        User teacher = teacherService.findByEmail(principal.getName());
        return ResponseEntity.ok(ApiResponse.of(teacher));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<User>> findById(@PathVariable Long id) {
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
                ? Long.valueOf(body.get("preferredCampusId").toString())
                : null;

        teacherService.updateCampusFlexibility(id, flexible, preferredCampusId);
        return ResponseEntity.ok(
                ApiResponse.success("Campus flexibility updated"));
    }

    // ── DELETE /api/v1/teachers/{id} ─────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        teacherService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Teacher deactivated"));
    }

    // ── GET /api/v1/teachers/subject-preferences ──────────────────────────────

    @GetMapping("/subject-preferences")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ApiResponse<List<?>>> getMySubjectPreferences(
            @RequestParam String semester,
            @RequestParam String schoolYear,
            Principal principal) {
        Long teacherId = teacherService.findByEmail(principal.getName()).getId();
        return ResponseEntity.ok(ApiResponse.of(
                teacherService.getSubjectPreferences(teacherId, semester, schoolYear)));
    }

    // ── POST /api/v1/teachers/subject-preferences ─────────────────────────────

    @PostMapping("/subject-preferences")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> saveSubjectPreferences(
            @RequestBody Map<String, Object> body,
            Principal principal) {

        Long teacherId = teacherService.findByEmail(principal.getName()).getId();

        @SuppressWarnings("unchecked")
        List<Long> subjectIds = ((List<?>) body.get("subjectIds"))
                .stream().map(o -> Long.valueOf(o.toString())).toList();

        String vacantDay  = body.containsKey("vacantDay")  ? body.get("vacantDay").toString()  : null;
        String vacantTime = body.containsKey("vacantTime") ? body.get("vacantTime").toString() : null;

        teacherService.saveSubjectPreferences(
                teacherId,
                subjectIds,
                body.get("semester").toString(),
                body.get("schoolYear").toString(),
                vacantDay,
                vacantTime);

        return ResponseEntity.ok(ApiResponse.success("Preferences saved"));
    }

    // ── GET /api/v1/teachers/{id}/available-subjects ──────────────────────────

    @GetMapping("/{id}/available-subjects")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<?>>> getAvailableSubjects(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.of(teacherService.getAvailableSubjects(id)));
    }

    // ── GET /api/v1/teachers/{id}/subject-preferences ────────────────────────

    @GetMapping("/{id}/subject-preferences")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<?>>> getSubjectPreferencesById(
            @PathVariable Long id,
            @RequestParam String semester,
            @RequestParam String schoolYear) {
        return ResponseEntity.ok(ApiResponse.of(
                teacherService.getSubjectPreferences(id, semester, schoolYear)));
    }

    // ── POST /api/v1/teachers/{id}/subject-preferences ───────────────────────

    @PostMapping("/{id}/subject-preferences")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> saveSubjectPreferencesById(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        @SuppressWarnings("unchecked")
        List<Long> subjectIds = ((List<?>) body.get("subjectIds"))
                .stream().map(o -> Long.valueOf(o.toString())).toList();

        String vacantDay  = (body.get("vacantDay")  != null) ? body.get("vacantDay").toString()  : null;
        String vacantTime = (body.get("vacantTime") != null) ? body.get("vacantTime").toString() : null;
        String semester   = (body.get("semester")   != null) ? body.get("semester").toString()   : null;
        String schoolYear = (body.get("schoolYear") != null) ? body.get("schoolYear").toString() : null;

        teacherService.saveSubjectPreferences(
                id,
                subjectIds,
                semester,
                schoolYear,
                vacantDay,
                vacantTime);

        return ResponseEntity.ok(ApiResponse.success("Preferences saved"));
    }

    // ── GET /api/v1/teachers/{id}/availability ────────────────────────────────

    @GetMapping("/{id}/availability")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<?>>> getAvailability(
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
}