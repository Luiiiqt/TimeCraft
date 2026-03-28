package com.timecraft.timecraft.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.ConflictLog;
import com.timecraft.timecraft.model.ConflictLog.ConflictType;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.service.ConflictDetectionService;
import com.timecraft.timecraft.service.ConflictLogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/conflicts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ConflictController {

    private final ConflictLogService       conflictLogService;
    private final ConflictDetectionService conflictDetectionService;

    // ── GET /api/v1/conflicts ─────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConflictLog>>> findAll(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String schoolYear) {

        List<ConflictLog> conflicts;

        if (semester != null && schoolYear != null) {
            conflicts = conflictLogService.findUnresolvedByTerm(
                    Semester.valueOf(semester), schoolYear);
        } else if (type != null) {
            conflicts = conflictLogService.findByType(
                    ConflictType.valueOf(type));
        } else {
            conflicts = conflictLogService.findAllUnresolved();
        }

        return ResponseEntity.ok(ApiResponse.of(conflicts));
    }

    // ── GET /api/v1/conflicts/count ───────────────────────────────────────────

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCount() {
        long count = conflictLogService.countUnresolved();
        return ResponseEntity.ok(
                ApiResponse.of(Map.of("unresolvedConflicts", count)));
    }

    // ── GET /api/v1/conflicts/schedule/{scheduleId} ───────────────────────────

    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<ApiResponse<List<ConflictLog>>> findBySchedule(
            @PathVariable Long scheduleId) {
        return ResponseEntity.ok(ApiResponse.of(
                conflictLogService.findBySchedule(scheduleId)));
    }

    // ── PUT /api/v1/conflicts/{id}/resolve ────────────────────────────────────

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolve(@PathVariable Long id) {
        conflictLogService.resolve(id);
        return ResponseEntity.ok(ApiResponse.success("Conflict resolved"));
    }

    // ── PUT /api/v1/conflicts/resolve-all/{scheduleId} ────────────────────────

    @PutMapping("/resolve-all/{scheduleId}")
    public ResponseEntity<ApiResponse<Void>> resolveAllForSchedule(
            @PathVariable Long scheduleId) {
        conflictLogService.resolveAllForSchedule(scheduleId);
        return ResponseEntity.ok(
                ApiResponse.success("All conflicts resolved for schedule"));
    }

    // ── POST /api/v1/conflicts/audit ──────────────────────────────────────────
    // Runs a full conflict scan over a term's existing schedules

    @PostMapping("/audit")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> audit(
            @RequestParam String semester,
            @RequestParam String schoolYear) {

        int found = conflictDetectionService.auditTerm(
                Semester.valueOf(semester), schoolYear);

        return ResponseEntity.ok(ApiResponse.success(
                "Audit complete",
                Map.of("newConflictsFound", found)));
    }
}