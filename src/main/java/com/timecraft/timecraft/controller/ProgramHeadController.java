package com.timecraft.timecraft.controller;

import java.security.Principal;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.repository.UserRepository;
import com.timecraft.timecraft.service.ProgramHeadService;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints exclusively for the PROGRAM_HEAD role.
 * Program Heads can:
 *  - view their managed courses
 *  - view teacher preferences grouped by subject (read-only)
 *  - assign a teacher to a subject and finalize
 *  - view finalized assignments
 */
@RestController
@RequestMapping("/api/v1/program-head")
@RequiredArgsConstructor
public class ProgramHeadController {

    private final ProgramHeadService programHeadService;
    private final UserRepository userRepository;

    // ── GET /api/v1/program-head/my-courses ───────────────────────────────────

    @GetMapping("/my-courses")
    @PreAuthorize("hasAnyRole('PROGRAM_HEAD','DEAN','ADMIN')")
    public ResponseEntity<ApiResponse<List<Course>>> getMyCourses(Principal principal) {
        Long userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.of(programHeadService.getManagedCourses(userId)));
    }

    // ── GET /api/v1/program-head/preferences/grouped ──────────────────────────
    // Returns subjects with teacher votes for this PH's department courses

    @GetMapping("/preferences/grouped")
    @PreAuthorize("hasAnyRole('PROGRAM_HEAD','DEAN','ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGroupedPreferences(
            @RequestParam String semester,
            @RequestParam String schoolYear,
            Principal principal) {

        Long userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.of(
                programHeadService.getPreferencesGroupedBySubject(userId, semester, schoolYear)));
    }

    // ── GET /api/v1/program-head/assignments ──────────────────────────────────

    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('PROGRAM_HEAD','DEAN','ADMIN')")
    public ResponseEntity<ApiResponse<List<SubjectAssignment>>> getAssignments(
            @RequestParam String semester,
            @RequestParam String schoolYear,
            Principal principal) {

        Long userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.of(
                programHeadService.getAssignments(userId, semester, schoolYear)));
    }

    // ── POST /api/v1/program-head/assignments ─────────────────────────────────
    // PH assigns a teacher to a subject (no section required at this step).
    // sectionId is optional — if omitted, assignment is subject-level only.

    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('PROGRAM_HEAD','DEAN','ADMIN')")
    public ResponseEntity<ApiResponse<SubjectAssignment>> saveAssignment(
            @RequestBody Map<String, Object> body,
            Principal principal) {

        Long userId = resolveUserId(principal);
        Long subjectId = Long.valueOf(body.get("subjectId").toString());
        Long teacherId = Long.valueOf(body.get("teacherId").toString());
        String semester = body.get("semester").toString();
        String schoolYear = body.get("schoolYear").toString();

        // Section assignment is handled by the Dean — PH assigns teacher to subject only

        SubjectAssignment assignment = programHeadService.saveAssignment(
                userId, subjectId, teacherId, semester, schoolYear);

        return ResponseEntity.ok(ApiResponse.success("Assignment saved", assignment));
    }

    // ── PUT /api/v1/program-head/assignments/{id}/finalize ────────────────────

    @PutMapping("/assignments/{id}/finalize")
    @PreAuthorize("hasAnyRole('PROGRAM_HEAD','DEAN','ADMIN')")
    public ResponseEntity<ApiResponse<SubjectAssignment>> finalize(
            @PathVariable Long id,
            Principal principal) {

        Long userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.success("Assignment finalized",
                programHeadService.finalizeAssignment(id, userId)));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Long resolveUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}