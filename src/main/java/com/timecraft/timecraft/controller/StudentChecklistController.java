package com.timecraft.timecraft.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.request.ChecklistRequest;
import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.StudentChecklist;
import com.timecraft.timecraft.service.StudentChecklistService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/checklist")
@RequiredArgsConstructor
public class StudentChecklistController {

    private final StudentChecklistService studentChecklistService;

    // ── POST /api/v1/checklist/enroll ─────────────────────────────────────────

    /**
     * Student submits or replaces their subject checklist for a semester.
     * Any previous entries for the same term are wiped and replaced.
     */
    @PostMapping("/enroll")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentChecklist>>> enroll(
            @Valid @RequestBody ChecklistRequest request,
            Principal principal) {

        List<StudentChecklist> saved = studentChecklistService.enroll(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.of(saved));
    }

    // ── GET /api/v1/checklist/my ──────────────────────────────────────────────

    /** Student views their own checklist for a given term. */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentChecklist>>> getMyChecklist(
            Principal principal) {

        List<StudentChecklist> checklist = studentChecklistService.getByStudent(principal.getName());
        return ResponseEntity.ok(ApiResponse.of(checklist));
    }

    // ── GET /api/v1/checklist/semester/{semester}/{academicYear} ──────────────

    /**
     * Admin views all enrolled subjects for a given semester — used for scheduling.
     */
    @GetMapping("/semester/{semester}/{academicYear}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentChecklist>>> getBySemester(
            @PathVariable String semester,
            @PathVariable String academicYear) {

        List<StudentChecklist> entries = studentChecklistService.getBySemester(semester, academicYear);
        return ResponseEntity.ok(ApiResponse.of(entries));
    }

    // ── GET /api/v1/checklist/demand/{semester}/{academicYear} ────────────────

    /**
     * Admin views subject demand counts — how many students enrolled per subject.
     */
    @GetMapping("/demand/{semester}/{academicYear}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Object[]>>> getDemand(
            @PathVariable String semester,
            @PathVariable String academicYear) {

        List<Object[]> demand = studentChecklistService.getSubjectDemand(semester, academicYear);
        return ResponseEntity.ok(ApiResponse.of(demand));
    }

    // ── DELETE /api/v1/checklist/{id} ─────────────────────────────────────────

    /** Admin removes a single checklist entry. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        studentChecklistService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Checklist entry removed"));
    }
}