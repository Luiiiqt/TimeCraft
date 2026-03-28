package com.timecraft.timecraft.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    // ── GET /api/v1/reports/teaching-load ─────────────────────────────────────

    @GetMapping("/teaching-load")
    public ResponseEntity<ApiResponse<List<Object[]>>> teachingLoad(
            @RequestParam String semester,
            @RequestParam String schoolYear) {
        return ResponseEntity.ok(ApiResponse.of(
                reportService.getTeachingLoadReport(
                        Semester.valueOf(semester), schoolYear)));
    }

    // ── GET /api/v1/reports/teaching-load/{teacherId} ─────────────────────────
    // Teacher load broken down by year level

    @GetMapping("/teaching-load/{teacherId}")
    public ResponseEntity<ApiResponse<List<Object[]>>> teachingLoadByYear(
            @PathVariable Long teacherId,
            @RequestParam String semester,
            @RequestParam String schoolYear) {
        return ResponseEntity.ok(ApiResponse.of(
                reportService.getTeacherLoadByYearLevel(
                        teacherId, Semester.valueOf(semester), schoolYear)));
    }

    // ── GET /api/v1/reports/room-utilisation ──────────────────────────────────

    @GetMapping("/room-utilisation")
    public ResponseEntity<ApiResponse<List<Object[]>>> roomUtilisation(
            @RequestParam Long campusId,
            @RequestParam String semester,
            @RequestParam String schoolYear) {
        return ResponseEntity.ok(ApiResponse.of(
                reportService.getRoomUtilisationReport(
                        campusId, Semester.valueOf(semester), schoolYear)));
    }

    // ── GET /api/v1/reports/conflicts ─────────────────────────────────────────

    @GetMapping("/conflicts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> conflictSummary(
            @RequestParam String semester,
            @RequestParam String schoolYear) {

        long total      = reportService.getTotalUnresolvedConflicts();
        long termTotal  = reportService.getUnresolvedConflictsByTerm(
                Semester.valueOf(semester), schoolYear);

        return ResponseEntity.ok(ApiResponse.of(Map.of(
                "totalUnresolved",     total,
                "termUnresolved",      termTotal,
                "semester",            semester,
                "schoolYear",          schoolYear)));
    }
}