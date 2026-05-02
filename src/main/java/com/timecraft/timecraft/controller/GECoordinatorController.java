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
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.repository.UserRepository;
import com.timecraft.timecraft.service.GECoordinatorService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/ge-coordinator")
@RequiredArgsConstructor
public class GECoordinatorController {

    private final GECoordinatorService geService;
    private final UserRepository userRepository;

    // GE Coordinator sees only MINOR subjects with teacher votes
    @GetMapping("/preferences/grouped")
    @PreAuthorize("hasAnyRole('GE_COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGrouped(
            @RequestParam String semester,
            @RequestParam String schoolYear,
            Principal principal) {
        Long userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.of(
                geService.getMinorPreferencesGrouped(userId, semester, schoolYear)));
    }

    // Assign + finalize a GE teacher to a minor subject
    @PostMapping("/assignments")
    @PreAuthorize("hasAnyRole('GE_COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<SubjectAssignment>> assign(
            @RequestBody Map<String, Object> body,
            Principal principal) {
        Long userId   = resolveUserId(principal);
        Long subjectId = Long.valueOf(body.get("subjectId").toString());
        Long teacherId = Long.valueOf(body.get("teacherId").toString());
        String semester   = body.get("semester").toString();
        String schoolYear = body.get("schoolYear").toString();
        return ResponseEntity.ok(ApiResponse.success("GE assignment saved",
                geService.assignAndFinalize(userId, subjectId, teacherId, semester, schoolYear)));
    }

    // View finalized GE assignments
    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('GE_COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<SubjectAssignment>>> getAssignments(
            @RequestParam String semester,
            @RequestParam String schoolYear,
            Principal principal) {
        Long userId = resolveUserId(principal);
        return ResponseEntity.ok(ApiResponse.of(
                geService.getAssignments(userId, semester, schoolYear)));
    }

    // View schedule (published)
    @GetMapping("/schedule/section/{sectionId}")
    @PreAuthorize("hasAnyRole('GE_COORDINATOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<com.timecraft.timecraft.dto.response.ScheduleResponse>>> getSchedule(
            @PathVariable Long sectionId,
            @RequestParam String semester,
            @RequestParam String schoolYear,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.of(
                geService.getPublishedSchedule(sectionId, semester, schoolYear)));
    }

    private Long resolveUserId(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow().getId();
    }
}