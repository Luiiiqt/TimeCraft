package com.timecraft.timecraft.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.repository.CourseRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseRepository courseRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PROGRAM_HEAD','TEACHER')")
    public ResponseEntity<ApiResponse<List<java.util.Map<String, Object>>>> getCourses(
            @RequestParam(required = false) Long departmentId) {

        List<Course> courses = departmentId != null
                ? courseRepository.findByDepartmentIdAndIsActiveTrue(departmentId)
                : courseRepository.findByIsActiveTrue();

        // Return only safe fields to avoid circular JSON serialization
        List<java.util.Map<String, Object>> result = courses.stream().map(c -> {
            java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("id", c.getId());
            map.put("name", c.getName());
            map.put("code", c.getCode());
            map.put("degreeLevel", c.getDegreeLevel());
            map.put("yearsDuration", c.getYearsDuration());
            return map;
        }).toList();

        return ResponseEntity.ok(ApiResponse.of(result));
    }
}