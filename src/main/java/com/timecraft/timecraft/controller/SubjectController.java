package com.timecraft.timecraft.controller;

import java.util.List;

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

import com.timecraft.timecraft.dto.request.SubjectRequest;
import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.Subject.SessionType;
import com.timecraft.timecraft.model.Subject.SubjectType;
import com.timecraft.timecraft.service.SubjectService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    // ── GET /api/v1/subjects ──────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<Subject>>> findAll(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String sessionType,
            @RequestParam(required = false) String search) {

        List<Subject> subjects;

        if (search != null && !search.isBlank()) {
            subjects = subjectService.search(search);
        } else if (departmentId != null) {
            subjects = subjectService.findByDepartment(departmentId);
        } else if (type != null) {
            subjects = subjectService.findByType(SubjectType.valueOf(type));
        } else if (sessionType != null) {
            subjects = subjectService.findBySessionType(
                    SessionType.valueOf(sessionType));
        } else {
            subjects = subjectService.findAll();
        }

        return ResponseEntity.ok(ApiResponse.of(subjects));
    }

    // ── GET /api/v1/subjects/{id} ─────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Subject>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(subjectService.findById(id)));
    }

    // ── GET /api/v1/subjects/course/{courseId} ────────────────────────────────

    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<Subject>>> findByCourse(
            @PathVariable Long courseId,
            @RequestParam short yearLevel,
            @RequestParam String semester) {
        return ResponseEntity.ok(ApiResponse.of(
                subjectService.findByCourseYearSemester(
                        courseId, yearLevel,
                        com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester))));
    }

    // ── GET /api/v1/subjects/course/{courseId}/curriculum ─────────────────────

    @GetMapping("/course/{courseId}/curriculum")
    public ResponseEntity<ApiResponse<List<CourseSubject>>> getFullCurriculum(
            @PathVariable Long courseId) {
        return ResponseEntity.ok(
                ApiResponse.of(subjectService.findFullCurriculum(courseId)));
    }
    // ── POST /api/v1/subjects ─────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Subject>> create(
            @Valid @RequestBody SubjectRequest request) {
        Subject subject = subjectService.create(
                request.getName(),
                request.getCode(),
                SubjectType.valueOf(request.getSubjectType()),
                SessionType.valueOf(request.getSessionType()),
                request.getUnits(),
                request.getPrerequisite(),
                request.getDepartmentId());
        return ResponseEntity.ok(ApiResponse.success("Subject created", subject));
    }

    // ── PUT /api/v1/subjects/{id} ─────────────────────────────────────────────

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Subject>> update(
            @PathVariable Long id,
            @Valid @RequestBody SubjectRequest request) {
        Subject updated = subjectService.update(
                id,
                request.getName(),
                request.getCode(),
                SubjectType.valueOf(request.getSubjectType()),
                SessionType.valueOf(request.getSessionType()),
                request.getUnits(),
                request.getPrerequisite(),
                request.getDepartmentId());
        return ResponseEntity.ok(ApiResponse.success("Subject updated", updated));
    }

    // ── PUT /api/v1/subjects/{id}/deactivate ──────────────────────────────────

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        subjectService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Subject deactivated"));
    }

    // ── DELETE /api/v1/subjects/{id} ──────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Subject deleted"));
    }
}