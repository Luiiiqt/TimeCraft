package com.timecraft.timecraft.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.Curriculum;
import com.timecraft.timecraft.repository.UserRepository;
import com.timecraft.timecraft.service.CurriculumService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/curriculum")
@RequiredArgsConstructor
public class CurriculumController {

    private final CurriculumService curriculumService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('DEAN','ADMIN')")
    public ResponseEntity<ApiResponse<List<Curriculum>>> getByCourse(
            @RequestParam Long courseId) {
        return ResponseEntity.ok(ApiResponse.of(
                curriculumService.getByCourse(courseId)));
    }

    @PostMapping(value = "/import",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DEAN','ADMIN')")
    public ResponseEntity<ApiResponse<Curriculum>> importCurriculum(
            @RequestParam Long courseId,
            @RequestParam String effectiveYear,
            @RequestParam String curriculumName,
            @RequestParam MultipartFile file,
            Principal principal) throws Exception {

        Long userId = userRepository.findByEmail(principal.getName())
                .orElseThrow().getId();

        Curriculum result = curriculumService.importFile(
                courseId, effectiveYear, curriculumName, userId, file);

        return ResponseEntity.ok(
                ApiResponse.success("Curriculum imported successfully", result));
    }
}