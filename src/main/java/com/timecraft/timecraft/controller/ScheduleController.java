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
import com.timecraft.timecraft.dto.response.ScheduleResponse;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.StudentSchedule;
import com.timecraft.timecraft.repository.UserRepository;
import com.timecraft.timecraft.service.ScheduleService;
import com.timecraft.timecraft.service.SchedulingEngine;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService            scheduleService;
    private final SchedulingEngine           schedulingEngine;
    
    private final UserRepository userRepository;

    // ── GET /api/v1/schedules ─────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> findAll(
            @RequestParam String semester,
            @RequestParam String schoolYear,
            @RequestParam(required = false) String status) {

        List<Schedule> schedules;
        if (status != null) {
            schedules = scheduleService.findConflicted(); // expand as needed
        } else {
            schedules = scheduleService.findByTerm(
                    Semester.valueOf(semester), schoolYear);
        }

        List<ScheduleResponse> responses = schedules.stream()
                .map(ScheduleResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.of(responses));
    }

    // ── GET /api/v1/schedules/my ──────────────────────────────────────────────
    // Student views their own timetable

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('STUDENT', 'TEACHER', 'ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getSectionSchedule(
            @RequestParam String semester,
            @RequestParam String schoolYear,
            Principal principal) {

        // Resolve user ID from principal — simplified; use UserService in practice
        List<Schedule> schedules = scheduleService.findByStudent(
                resolveUserId(principal.getName()),
                Semester.valueOf(semester), schoolYear);

        return ResponseEntity.ok(ApiResponse.of(
                schedules.stream().map(ScheduleResponse::from).toList()));
    }

    // ── GET /api/v1/schedules/teacher/{teacherId} ─────────────────────────────
    // Full teacher load across all year levels

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getTeacherSchedule(
            @PathVariable Long teacherId,
            @RequestParam String semester,
            @RequestParam String schoolYear) {

        List<Schedule> schedules = scheduleService.findByTeacher(
                teacherId, Semester.valueOf(semester), schoolYear);

        return ResponseEntity.ok(ApiResponse.of(
                schedules.stream().map(ScheduleResponse::from).toList()));
    }

    // ── GET /api/v1/schedules/section/{sectionId} ─────────────────────────────

    @GetMapping("/section/{sectionId}")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN','DEAN','PROGRAM_HEAD','GE_COORDINATOR')")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getSectionScheduleById(
            @PathVariable Long sectionId,
            @RequestParam String semester,
            @RequestParam String schoolYear) {

        List<Schedule> schedules = scheduleService.findBySection(
                sectionId, Semester.valueOf(semester), schoolYear);

        return ResponseEntity.ok(ApiResponse.of(
                schedules.stream().map(ScheduleResponse::from).toList()));
    }

    // ── GET /api/v1/schedules/room/{roomId} ───────────────────────────────────

    @GetMapping("/room/{roomId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getRoomSchedule(
            @PathVariable Long roomId,
            @RequestParam String semester,
            @RequestParam String schoolYear) {

        List<Schedule> schedules = scheduleService.findByRoom(
                roomId, Semester.valueOf(semester), schoolYear);

        return ResponseEntity.ok(ApiResponse.of(
                schedules.stream().map(ScheduleResponse::from).toList()));
    }

    // ── GET /api/v1/schedules/published ───────────────────────────────────────
    // All roles can see published schedules for a section

    @GetMapping("/published/section/{sectionId}")
    @PreAuthorize("hasAnyRole('STUDENT','TEACHER','DEAN','PROGRAM_HEAD','GE_COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getPublishedBySection(
            @PathVariable Long sectionId,
            @RequestParam String semester,
            @RequestParam String schoolYear) {

        List<Schedule> schedules = scheduleService.findBySection(
                sectionId, Semester.valueOf(semester), schoolYear)
                .stream()
                .filter(s -> s.getStatus() == Schedule.ScheduleStatus.PUBLISHED)
                .toList();

        return ResponseEntity.ok(ApiResponse.of(
                schedules.stream().map(ScheduleResponse::from).toList()));
    }

    @GetMapping("/published/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('TEACHER','DEAN','PROGRAM_HEAD','ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getPublishedByTeacher(
            @PathVariable Long teacherId,
            @RequestParam String semester,
            @RequestParam String schoolYear) {

        List<Schedule> schedules = scheduleService.findByTeacher(
                teacherId, Semester.valueOf(semester), schoolYear)
                .stream()
                .filter(s -> s.getStatus() == Schedule.ScheduleStatus.PUBLISHED)
                .toList();

        return ResponseEntity.ok(ApiResponse.of(
                schedules.stream().map(ScheduleResponse::from).toList()));
    }

    // ── GET /api/v1/schedules/conflicted ──────────────────────────────────────

    @GetMapping("/conflicted")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleResponse>>> getConflicted() {
        List<Schedule> schedules = scheduleService.findConflicted();
        return ResponseEntity.ok(ApiResponse.of(
                schedules.stream().map(ScheduleResponse::from).toList()));
    }

    // ── POST /api/v1/schedules/generate ───────────────────────────────────────

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generate(
            @Valid @RequestBody ScheduleGenerateRequest request) {

        List<Schedule> generated = schedulingEngine.generateForTerm(request);

        long total      = generated.size();
        long conflicted = generated.stream()
                .filter(s -> s.getStatus() ==
                        Schedule.ScheduleStatus.CONFLICTED)
                .count();
        long success    = total - conflicted;

        if (request.isAutoPublish() && conflicted == 0) {
            scheduleService.publishAll(
                    request.getSemester(), request.getSchoolYear());
        }

        String ollamaExplanation = "";

        Map<String, Object> summary = Map.of(
                "total",           total,
                "successful",      success,
                "conflicted",      conflicted,
                "semester",        request.getSemester().getLabel(),
                "schoolYear",      request.getSchoolYear(),
                "aiSummary",       ollamaExplanation);

        return ResponseEntity.ok(
                ApiResponse.success("Schedule generation complete", summary));
    }

    // ── POST /api/v1/schedules (manual override) ──────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleResponse>> createManual(
            @RequestBody Map<String, Object> body) {

        Schedule schedule = scheduleService.createManual(
                Long.valueOf(body.get("subjectId").toString()),
                Long.valueOf(body.get("roomId").toString()),
                Long.valueOf(body.get("teacherId").toString()),
                Long.valueOf(body.get("timeslotId").toString()),
                Long.valueOf(body.get("timeslot2Id").toString()),
                Long.valueOf(body.get("sectionId").toString()),
                Semester.valueOf((String) body.get("semester")),
                (String) body.get("schoolYear"),
                Long.valueOf(body.get("campusId").toString()));

        return ResponseEntity.ok(
                ApiResponse.success("Schedule created",
                        ScheduleResponse.from(schedule)));
    }

    // ── PUT /api/v1/schedules/{id}/publish ────────────────────────────────────

    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('ADMIN','DEAN')")
    public ResponseEntity<ApiResponse<Void>> publish(@PathVariable Long id) {
        scheduleService.publish(id);
        return ResponseEntity.ok(ApiResponse.success("Schedule published"));
    }

    // ── PUT /api/v1/schedules/publish-all ─────────────────────────────────────

    @PutMapping("/publish-all")
    @PreAuthorize("hasAnyRole('ADMIN','DEAN')")
    public ResponseEntity<ApiResponse<Void>> publishAll(
            @RequestParam String semester,
            @RequestParam String schoolYear) {
        scheduleService.publishAll(
                Semester.valueOf(semester), schoolYear);
        return ResponseEntity.ok(
                ApiResponse.success("All draft schedules published"));
    }

    // ── POST /api/v1/schedules/{id}/assign-student ────────────────────────────
    // Assign an irregular student to a specific class

    @PostMapping("/{id}/assign-student")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentSchedule>> assignStudent(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {

        StudentSchedule ss = scheduleService.assignIrregularStudent(
                body.get("studentId"), id);
        return ResponseEntity.ok(
                ApiResponse.success("Student assigned to schedule", ss));
    }

    // ── DELETE /api/v1/schedules/{id}/remove-student ──────────────────────────

    @DeleteMapping("/{id}/remove-student")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeStudent(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {

        scheduleService.removeIrregularStudent(body.get("studentId"), id);
        return ResponseEntity.ok(
                ApiResponse.success("Student removed from schedule"));
    }

    // ── GET /api/v1/schedules/is-locked ───────────────────────────────────────

    @GetMapping("/is-locked")
    @PreAuthorize("hasAnyRole('ADMIN','DEAN')")
    public ResponseEntity<ApiResponse<Boolean>> isLocked(
            @RequestParam Long courseId,
            @RequestParam String semester,
            @RequestParam String schoolYear) {
        boolean locked = scheduleService.isLockedForCourse(
                courseId, Semester.valueOf(semester), schoolYear);
        return ResponseEntity.ok(ApiResponse.of(locked));
    }

    // ── Teaching load report ──────────────────────────────────────────────────

    @GetMapping("/load-report")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Object[]>>> loadReport(
            @RequestParam String semester,
            @RequestParam String schoolYear) {
        return ResponseEntity.ok(ApiResponse.of(
                scheduleService.getTeachingLoadReport(
                        Semester.valueOf(semester), schoolYear)));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Long resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow()
                .getId();
    }
}