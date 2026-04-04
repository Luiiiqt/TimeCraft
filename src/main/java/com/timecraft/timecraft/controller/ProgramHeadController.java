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

import com.timecraft.timecraft.dto.request.ScheduleGenerateRequest;
import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.model.TeacherSubjectPreference.Status;
import com.timecraft.timecraft.repository.UserRepository;
import com.timecraft.timecraft.service.ProgramHeadService;
import com.timecraft.timecraft.service.SchedulingEngine;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/program-head")
@RequiredArgsConstructor
public class ProgramHeadController {

        private final ProgramHeadService programHeadService;
        private final SchedulingEngine schedulingEngine;
        private final UserRepository userRepository;

        // ── GET /api/v1/program-head/assignments ──────────────────────────────────

        @GetMapping("/assignments")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<List<SubjectAssignment>>> getAssignments(
                        @RequestParam String semester,
                        @RequestParam String schoolYear,
                        Principal principal) {

                Long userId = resolveUserId(principal);
                return ResponseEntity.ok(ApiResponse.of(
                                programHeadService.getMyAssignments(userId, semester, schoolYear)));
        }

        // ── POST /api/v1/program-head/assignments ─────────────────────────────────

        @PostMapping("/assignments")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<SubjectAssignment>> saveAssignment(
                        @RequestBody Map<String, Object> body,
                        Principal principal) {

                Long userId = resolveUserId(principal);
                Long subjectId = Long.valueOf(body.get("subjectId").toString());
                Long sectionId = Long.valueOf(body.get("sectionId").toString());
                Long teacherId = Long.valueOf(body.get("teacherId").toString());
                String semester = body.get("semester").toString();
                String schoolYear = body.get("schoolYear").toString();

                return ResponseEntity.ok(ApiResponse.success("Assignment saved",
                                programHeadService.saveAssignment(
                                                userId, subjectId, sectionId, teacherId, semester, schoolYear)));
        }

        // ── PUT /api/v1/program-head/assignments/{id}/finalize ────────────────────

        @PutMapping("/assignments/{id}/finalize")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<SubjectAssignment>> finalize(
                        @PathVariable Long id,
                        Principal principal) {

                Long userId = resolveUserId(principal);
                return ResponseEntity.ok(ApiResponse.success("Assignment finalized",
                                programHeadService.finalizeAssignment(id, userId)));
        }

        // ── DELETE /api/v1/program-head/assignments/{id} ──────────────────────────

        @DeleteMapping("/assignments/{id}")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<Void>> deleteAssignment(
                        @PathVariable Long id,
                        Principal principal) {

                Long userId = resolveUserId(principal);
                programHeadService.deleteAssignment(id, userId);
                return ResponseEntity.ok(ApiResponse.success("Assignment deleted"));
        }

        // ── GET /api/v1/program-head/preferences ──────────────────────────────────
        // View teacher-submitted subject preferences for this department

        @GetMapping("/preferences")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<List<TeacherSubjectPreference>>> getPreferences(
                        @RequestParam String semester,
                        @RequestParam String schoolYear,
                        Principal principal) {

                Long userId = resolveUserId(principal);
                return ResponseEntity.ok(ApiResponse.of(
                                programHeadService.getPendingPreferences(
                                                userId, semester, schoolYear)));
        }

        // ── PUT /api/v1/program-head/preferences/{id}/review ─────────────────────

        @PutMapping("/preferences/{id}/review")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<TeacherSubjectPreference>> review(
                        @PathVariable Long id,
                        @RequestBody Map<String, String> body,
                        Principal principal) {

                Long userId = resolveUserId(principal);
                Status decision = Status.valueOf(body.get("decision").toUpperCase());

                return ResponseEntity.ok(ApiResponse.success("Preference reviewed",
                                programHeadService.reviewPreference(id, userId, decision)));
        }

        // ── POST /api/v1/program-head/curriculum ──────────────────────────────────
        // Assign a subject to a course curriculum (year level + semester)

        @PostMapping("/curriculum")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<Void>> addToCurriculum(
                        @RequestBody Map<String, Object> body,
                        Principal principal) {

                Long courseId = Long.valueOf(body.get("courseId").toString());
                Long subjectId = Long.valueOf(body.get("subjectId").toString());
                short yearLevel = Short.parseShort(body.get("yearLevel").toString());
                String semester = body.get("semester").toString();
                boolean isShared = body.containsKey("isShared")
                                && Boolean.parseBoolean(body.get("isShared").toString());

                programHeadService.addSubjectToCurriculum(
                                courseId, subjectId, yearLevel,
                                com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester),
                                isShared);

                return ResponseEntity.ok(ApiResponse.success("Subject added to curriculum"));
        }

        // ── DELETE /api/v1/program-head/curriculum ────────────────────────────────

        @DeleteMapping("/curriculum")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<Void>> removeFromCurriculum(
                        @RequestBody Map<String, Object> body) {

                Long courseId = Long.valueOf(body.get("courseId").toString());
                Long subjectId = Long.valueOf(body.get("subjectId").toString());

                programHeadService.removeSubjectFromCurriculum(courseId, subjectId);
                return ResponseEntity.ok(ApiResponse.success("Subject removed from curriculum"));
        }

        // ── Helper ────────────────────────────────────────────────────────────────

        private Long resolveUserId(Principal principal) {
                return userRepository.findByEmail(principal.getName())
                                .orElseThrow()
                                .getId();
        }

        @PostMapping("/generate/{courseId}")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<Map<String, Object>>> generateForCourse(
                        @PathVariable Long courseId,
                        @RequestBody ScheduleGenerateRequest request,
                        Principal principal) {

                Long userId = resolveUserId(principal);
                programHeadService.assertManagesCourse(userId, courseId);
                request.setCourseId(courseId);

                List<com.timecraft.timecraft.model.Schedule> generated =
                        schedulingEngine.generateForTerm(request);

                long total      = generated.size();
                long conflicted = generated.stream()
                        .filter(s -> s.getStatus() ==
                                com.timecraft.timecraft.model.Schedule.ScheduleStatus.CONFLICTED)
                        .count();
                long success    = total - conflicted;

                return ResponseEntity.ok(ApiResponse.success("Generation complete",
                        Map.of(
                                "total",      total,
                                "successful", success,
                                "conflicted", conflicted,
                                "semester",   request.getSemester().getLabel(),
                                "schoolYear", request.getSchoolYear())));
        }

        @GetMapping("/my-courses")
        @PreAuthorize("hasAnyRole('PROGRAM_HEAD','ADMIN')")
        public ResponseEntity<ApiResponse<List<Course>>> getMyCourses(Principal principal) {
                Long userId = resolveUserId(principal);
                return ResponseEntity.ok(ApiResponse.of(
                                programHeadService.getManagedCourses(userId)));
        }
}