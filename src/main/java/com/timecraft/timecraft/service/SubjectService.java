package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.DuplicateResourceException;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.Department;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.Subject.SessionType;
import com.timecraft.timecraft.model.Subject.SubjectType;
import com.timecraft.timecraft.repository.CourseSubjectRepository;
import com.timecraft.timecraft.repository.DepartmentRepository;
import com.timecraft.timecraft.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final CourseSubjectRepository courseSubjectRepository;
    private final DepartmentRepository departmentRepository;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public Subject findById(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Subject not found with id: " + id));
    }

    public java.util.Optional<Subject> findByCode(String code) {
        return subjectRepository.findByCode(code);
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<Subject> findAll() {
        return subjectRepository.findByIsActiveTrue();
    }

    public List<Subject> findByDepartment(Long departmentId) {
        return subjectRepository.findByDepartmentIdAndIsActiveTrue(departmentId);
    }

    public List<Subject> findByType(SubjectType type) {
        return subjectRepository.findBySubjectType(type);
    }

    public List<Subject> findBySessionType(SessionType sessionType) {
        return subjectRepository.findBySessionType(sessionType);
    }

    public List<Subject> findByCourseYearSemester(Long courseId,
            short yearLevel,
            com.timecraft.timecraft.model.CourseSubject.Semester semester) {
        return subjectRepository.findByCourseYearAndSemester(
                courseId, yearLevel, semester);
    }

    public List<Subject> findSharedSubjectsByCourse(Long courseId) {
        return subjectRepository.findSharedSubjectsByCourse(courseId);
    }

    public List<CourseSubject> findFullCurriculum(Long courseId) {
        return courseSubjectRepository.findFullCurriculumByCourseId(courseId);
    }

    public List<Subject> search(String keyword) {
        return subjectRepository.searchByNameOrCode(keyword);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public Subject create(String name, String code, SubjectType subjectType,
            SessionType sessionType, short units, String prerequisite,
            Long departmentId) {
        if (subjectRepository.existsByCode(code)) {
            throw new DuplicateResourceException(
                    "Subject code already exists: " + code);
        }
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found: " + departmentId));

        Subject prereqSubject = null;
        if (prerequisite != null && !prerequisite.isBlank()) {
            prereqSubject = subjectRepository.findByCode(prerequisite)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Prerequisite subject not found: " + prerequisite));
        }

        return subjectRepository.save(Subject.builder()
                .name(name)
                .code(code)
                .subjectType(subjectType)
                .sessionType(sessionType)
                .units(units)
                .prerequisite(prereqSubject)
                .department(dept)
                .build());
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public Subject update(Long id, String name, String code,
            SubjectType subjectType, SessionType sessionType,
            short units, String prerequisite, Long departmentId) {
        Subject subject = findById(id);

        // If code is changing, check it won't clash with another subject
        if (!subject.getCode().equals(code) && subjectRepository.existsByCode(code)) {
            throw new DuplicateResourceException(
                    "Subject code already exists: " + code);
        }

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found: " + departmentId));

        Subject prereqSubject = null;
        if (prerequisite != null && !prerequisite.isBlank()) {
            prereqSubject = subjectRepository.findByCode(prerequisite)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Prerequisite subject not found: " + prerequisite));
        }

        subject.setName(name);
        subject.setCode(code);
        subject.setSubjectType(subjectType);
        subject.setSessionType(sessionType);
        subject.setUnits(units);
        subject.setPrerequisite(prereqSubject);
        subject.setDepartment(dept);

        return subjectRepository.save(subject);
    }

    // ── Deactivate ────────────────────────────────────────────────────────────

    @Transactional
    public void deactivate(Long id) {
        Subject subject = findById(id);
        subject.setActive(false);
        subjectRepository.save(subject);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        Subject subject = findById(id);

        // Guard: do not hard-delete if subject is linked to any course curriculum
        if (!subject.getCourseSubjects().isEmpty()) {
            throw new IllegalStateException(
                    "Cannot delete subject '" + subject.getCode() +
                            "' — it is still assigned to " +
                            subject.getCourseSubjects().size() +
                            " course(s). Deactivate it instead.");
        }

        subjectRepository.delete(subject);
    }
}