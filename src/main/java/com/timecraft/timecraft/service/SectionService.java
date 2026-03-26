package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.DuplicateResourceException;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.SectionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SectionService {

    private final SectionRepository sectionRepository;
    private final CourseRepository courseRepository;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public Section findById(Long id) {
        return sectionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Section not found with id: " + id));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<Section> findAll() {
        return sectionRepository.findAll();
    }

    public List<Section> findByCourse(Long courseId) {
        return sectionRepository.findByCourseId(courseId);
    }

    public List<Section> findByCourseAndYear(Long courseId, short yearLevel) {
        return sectionRepository.findByCourseIdAndYearLevel(courseId, yearLevel);
    }

    public List<Section> findByTerm(Semester semester, String schoolYear) {
        return sectionRepository.findBySemesterAndSchoolYear(semester, schoolYear);
    }

    public List<Section> findByCourseYearAndTerm(Long courseId, short yearLevel,
            Semester semester,
            String schoolYear) {
        return sectionRepository.findByCourseIdAndYearLevelAndSemesterAndSchoolYear(
                courseId, yearLevel, semester, schoolYear);
    }

    public long countEnrolled(Long sectionId) {
        return sectionRepository.countRegularStudentsBySection(sectionId);
    }

    public boolean isFull(Long sectionId) {
        Section section = findById(sectionId);
        long enrolled = countEnrolled(sectionId);
        return enrolled >= section.getMaxStudents();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public Section create(Long courseId, short yearLevel, String sectionName,
            Semester semester, String schoolYear, short maxStudents) {
        if (sectionRepository
                .existsByCourseIdAndYearLevelAndSectionNameAndSemesterAndSchoolYear(
                        courseId, yearLevel, sectionName, semester, schoolYear)) {
            throw new DuplicateResourceException(
                    String.format("Section %s already exists for course %d " +
                            "year %d %s %s",
                            sectionName, courseId, yearLevel,
                            semester.getLabel(), schoolYear));
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course not found: " + courseId));

        return sectionRepository.save(Section.builder()
                .course(course)
                .yearLevel(yearLevel)
                .sectionName(sectionName)
                .semester(semester)
                .schoolYear(schoolYear)
                .maxStudents(maxStudents)
                .build());
    }

    // ── Deactivate ────────────────────────────────────────────────────────────

    @Transactional
    public void deactivate(Long id) {
        Section section = findById(id);
        section.setActive(false);
        sectionRepository.save(section);
    }
}