package com.timecraft.timecraft.controller;

import java.util.List;

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
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.service.SectionService;

import lombok.RequiredArgsConstructor;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;

    // ── GET /api/v1/sections ──────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Section>>> findAll(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Short yearLevel,
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) String schoolYear) {

        List<Section> sections;

        if (courseId != null && yearLevel != null
                && semester != null && schoolYear != null) {
            sections = sectionService.findByCourseYearAndTerm(
                    courseId, yearLevel,
                    Semester.valueOf(semester), schoolYear);
        } else if (courseId != null && yearLevel != null) {
            sections = sectionService.findByCourseAndYear(courseId, yearLevel);
        } else if (courseId != null) {
            sections = sectionService.findByCourse(courseId);
        } else if (semester != null && schoolYear != null) {
            sections = sectionService.findByTerm(
                    Semester.valueOf(semester), schoolYear);
        } else {
            sections = sectionService.findAll();
        }

        return ResponseEntity.ok(ApiResponse.of(sections));
    }

    // ── GET /api/v1/sections/{id} ─────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Section>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.of(sectionService.findById(id)));
    }

    // ── GET /api/v1/sections/{id}/enrollment-count ────────────────────────────

    @GetMapping("/{id}/enrollment-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEnrollmentCount(
            @PathVariable Long id) {
        long count = sectionService.countEnrolled(id);
        boolean isFull = sectionService.isFull(id);
        return ResponseEntity.ok(ApiResponse.of(
                Map.of("enrolled", count, "isFull", isFull)));
    }

    // ── POST /api/v1/sections ─────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Section>> create(
            @RequestBody Map<String, Object> body) {
        Section section = sectionService.create(
                Long.valueOf(body.get("courseId").toString()),
                Short.valueOf(body.get("yearLevel").toString()),
                (String) body.get("sectionName"),
                Semester.valueOf((String) body.get("semester")),
                (String) body.get("schoolYear"),
                body.get("maxStudents") != null
                        ? Short.valueOf(body.get("maxStudents").toString())
                        : 45);
        return ResponseEntity.ok(
                ApiResponse.success("Section created", section));
    }

    // ── PUT /api/v1/sections/{id}/deactivate ──────────────────────────────────

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        sectionService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Section deactivated"));
    }
}