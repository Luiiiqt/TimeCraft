package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.DuplicateResourceException;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.model.SectionConfig;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.SectionConfigRepository;
import com.timecraft.timecraft.repository.SectionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SectionService {

        private final SectionRepository sectionRepository;
        private final CourseRepository courseRepository;
        private final SectionConfigRepository sectionConfigRepository;

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

        public List<Section> findByCourseAndTerm(Long courseId,
                        Semester semester, String schoolYear) {
                return sectionRepository.findBySemesterAndSchoolYear(semester, schoolYear)
                                .stream()
                                .filter(s -> s.getCourse().getId().equals(courseId))
                                .filter(Section::isActive)
                                .toList();
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

        public List<Section> findByDepartmentAndTerm(Long departmentId,
                        Semester semester, String schoolYear) {
                return sectionRepository.findBySemesterAndSchoolYear(semester, schoolYear)
                                .stream()
                                .filter(s -> s.getCourse().getDepartment().getId().equals(departmentId))
                                .filter(Section::isActive)
                                .toList();
        }

        // ── Section config (PH sets section count) ────────────────────────────────

        private static final int GROUP_SPLIT_THRESHOLD = 40;

        @Transactional
        public void setSectionConfig(Long courseId, short yearLevel,
                        short sectionCount, Semester semester, String schoolYear) {
                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

                SectionConfig config = sectionConfigRepository
                                .findByCourseIdAndYearLevelAndSemesterAndSchoolYear(
                                                courseId, yearLevel, semester.name(), schoolYear)
                                .orElse(SectionConfig.builder()
                                                .course(course)
                                                .yearLevel(yearLevel)
                                                .semester(semester.name())
                                                .schoolYear(schoolYear)
                                                .build());
                config.setSectionCount(sectionCount);
                sectionConfigRepository.save(config);

                // Auto-create sections A, B, C… up to sectionCount
                for (int i = 0; i < sectionCount; i++) {
                        String name = String.valueOf((char) ('A' + i));
                        if (!sectionRepository
                                        .existsByCourseIdAndYearLevelAndSectionNameAndSemesterAndSchoolYear(
                                                        courseId, yearLevel, name, semester, schoolYear)) {
                                sectionRepository.save(Section.builder()
                                                .course(course)
                                                .yearLevel(yearLevel)
                                                .sectionName(name)
                                                .semester(semester)
                                                .schoolYear(schoolYear)
                                                .maxStudents((short) 45)
                                                .build());
                        }
                }
        }

        /**
         * Updates enrolled count and auto-splits into Group 1 / Group 2 if > 40.
         * For merged (BSCS+BSIT) sections, splitting applies to the combined total.
         */
        @Transactional
        public void updateEnrollmentAndGroups(Long sectionId, int enrolledCount) {
                Section section = findById(sectionId);
                section.setEnrolledCount(enrolledCount);

                if (enrolledCount > GROUP_SPLIT_THRESHOLD) {
                        // Find or create Group 1 and Group 2 variants
                        ensureGroup(section, 1);
                        ensureGroup(section, 2);
                        section.setGroupNumber(0); // parent has no group number
                } else {
                        section.setGroupNumber(0);
                }
                sectionRepository.save(section);
        }

        private void ensureGroup(Section parent, int groupNum) {
                String groupName = parent.getSectionName() + "-G" + groupNum;
                if (!sectionRepository.existsByCourseIdAndYearLevelAndSectionNameAndSemesterAndSchoolYear(
                                parent.getCourse().getId(), parent.getYearLevel(),
                                groupName, parent.getSemester(), parent.getSchoolYear())) {
                        sectionRepository.save(Section.builder()
                                        .course(parent.getCourse())
                                        .yearLevel(parent.getYearLevel())
                                        .sectionName(groupName)
                                        .semester(parent.getSemester())
                                        .schoolYear(parent.getSchoolYear())
                                        .maxStudents((short) 20)
                                        .enrolledCount(0)
                                        .groupNumber(groupNum)
                                        .build());
                }
        }

        public List<SectionConfig> getSectionConfigs(Long courseId,
                        Semester semester, String schoolYear) {
                return sectionConfigRepository
                                .findByCourseIdAndSemesterAndSchoolYear(
                                                courseId, semester.name(), schoolYear);
        }
}