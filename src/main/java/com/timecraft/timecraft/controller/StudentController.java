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
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.StudentProfile;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.service.ScheduleService;
import com.timecraft.timecraft.service.StudentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

        private final StudentService studentService;
        private final ScheduleService scheduleService;

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

        // ── GET /api/v1/students/my-enrollments ───────────────────────────────────

        @GetMapping("/my-enrollments")
        @PreAuthorize("hasRole('STUDENT')")
        public ResponseEntity<ApiResponse<List<Schedule>>> getMyEnrollments(
                        @RequestParam String semester,
                        @RequestParam String schoolYear,
                        Principal principal) {

                User user = studentService.findAll().stream()
                                .filter(u -> u.getEmail().equals(principal.getName()))
                                .findFirst()
                                .orElseThrow();

                List<Schedule> schedules = scheduleService.findByStudent(
                                user.getId(),
                                Semester.valueOf(semester),
                                schoolYear);

                return ResponseEntity.ok(ApiResponse.of(schedules));
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

        // ── POST /api/v1/students/{id}/irregular-enrollment ──────────────────────
        // Body: { "scheduleIds": [1,2,3], "semester": "FIRST", "schoolYear":
        // "2024-2025" }

        @PostMapping("/{id}/irregular-enrollment")
        @PreAuthorize("hasAnyRole('ADMIN', 'DEAN')")
        public ResponseEntity<ApiResponse<Void>> enrollIrregular(
                        @PathVariable Long id,
                        @RequestBody Map<String, Object> body) {

                @SuppressWarnings("unchecked")
                List<Integer> rawIds = (List<Integer>) body.get("scheduleIds");

                for (Integer scheduleId : rawIds) {
                        scheduleService.assignIrregularStudent(id, Long.valueOf(scheduleId));
                }

                return ResponseEntity.ok(
                                ApiResponse.success("Irregular enrollment saved successfully"));
        }

        // ── PUT /api/v1/students/{id}/application-status ─────────────────────────

    @PutMapping("/{id}/application-status")
    @PreAuthorize("hasAnyRole('ADMIN','DEAN')")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Principal principal) {

        User reviewer = studentService.findAll().stream()
                .filter(u -> u.getEmail().equals(principal.getName()))
                .findFirst().orElseThrow();

        studentService.updateApplicationStatus(
                id,
                com.timecraft.timecraft.model.StudentProfile.ApplicationStatus
                        .valueOf(body.get("status").toUpperCase()),
                reviewer.getId(),
                body.get("notes"));

        return ResponseEntity.ok(ApiResponse.success("Application status updated"));
    }

    // ── GET /api/v1/students/pending-irregular ────────────────────────────────

    @GetMapping("/pending-irregular")
    @PreAuthorize("hasAnyRole('ADMIN','DEAN')")
    public ResponseEntity<ApiResponse<List<StudentProfile>>> getPendingIrregular() {
        return ResponseEntity.ok(ApiResponse.of(
                studentService.findPendingIrregular()));
    }
}