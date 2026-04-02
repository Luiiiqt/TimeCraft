package com.timecraft.timecraft.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.repository.ConflictLogRepository;
import com.timecraft.timecraft.repository.RoomRepository;
import com.timecraft.timecraft.repository.SectionRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final RoomRepository roomRepository;
    private final ConflictLogRepository conflictLogRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.of(Map.of(
                "totalStudents",        userRepository.findByUserTypeAndIsActiveTrue(UserType.STUDENT).size(),
                "totalTeachers",        userRepository.findByUserTypeAndIsActiveTrue(UserType.TEACHER).size(),
                "totalSections",        sectionRepository.findByIsActiveTrue().size(),
                "totalRooms",           roomRepository.findAll().size(),
                "unresolvedConflicts",  conflictLogRepository.countByResolvedFalse()
        )));
    }
}