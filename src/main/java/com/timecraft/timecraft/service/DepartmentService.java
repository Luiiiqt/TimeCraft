package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.DuplicateResourceException;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.Department;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.DepartmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public Department findById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with id: " + id));
    }

    public Department findByCode(String code) {
        return departmentRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with code: " + code));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    public List<Department> findAllActive() {
        return departmentRepository.findByIsActiveTrue();
    }

    public List<Course> findCoursesByDepartment(Long departmentId) {
        return courseRepository.findByDepartmentIdAndIsActiveTrue(departmentId);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public Department create(String name, String code) {
        if (departmentRepository.existsByCode(code)) {
            throw new DuplicateResourceException(
                    "Department code already exists: " + code);
        }
        if (departmentRepository.existsByName(name)) {
            throw new DuplicateResourceException(
                    "Department name already exists: " + name);
        }
        return departmentRepository.save(
                Department.builder().name(name).code(code).build());
    }

    // ── Deactivate ────────────────────────────────────────────────────────────

    @Transactional
    public void deactivate(Long id) {
        Department dept = findById(id);
        dept.setActive(false);
        departmentRepository.save(dept);
    }
}