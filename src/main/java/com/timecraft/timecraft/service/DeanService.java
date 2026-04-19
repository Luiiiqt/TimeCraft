package com.timecraft.timecraft.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.DeanProfile;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.model.TeacherSubjectPreference.Status;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.CourseSubjectRepository;
import com.timecraft.timecraft.repository.DeanProfileRepository;
import com.timecraft.timecraft.repository.SectionRepository;
import com.timecraft.timecraft.repository.SubjectAssignmentRepository;
import com.timecraft.timecraft.repository.SubjectRepository;
import com.timecraft.timecraft.repository.TeacherSubjectPreferenceRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeanService {

        private final DeanProfileRepository programHeadProfileRepository;
        private final SubjectAssignmentRepository subjectAssignmentRepository;
        private final TeacherSubjectPreferenceRepository preferenceRepository;
        private final SubjectRepository subjectRepository;
        private final UserRepository userRepository;
        private final SectionRepository sectionRepository;
        private final CourseSubjectRepository courseSubjectRepository;
        private final CourseRepository courseRepository;
        private final com.timecraft.timecraft.repository.DeanCourseRepository programHeadCourseRepository;

        // ── Profile ───────────────────────────────────────────────────────────────

        public DeanProfile getProfile(Long userId) {
                return programHeadProfileRepository.findByUserId(userId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Program head profile not found: " + userId));
        }

        // ── Subject assignments (program head input) ──────────────────────────────

        public List<SubjectAssignment> getMyAssignments(Long programHeadId,
                        String semester, String schoolYear) {
                return subjectAssignmentRepository
                                .findByAssignedByIdAndSemesterAndSchoolYear(
                                                programHeadId, semester, schoolYear);
        }

        @Transactional
        public SubjectAssignment saveAssignment(Long programHeadId,
                        Long subjectId, Long sectionId, Long teacherId,
                        String semester, String schoolYear) {

                Subject subject = subjectRepository.findById(subjectId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Subject not found: " + subjectId));

                List<Long> managedCourseIds = programHeadCourseRepository
                                .findByDeanUserId(programHeadId)
                                .stream()
                                .map(com.timecraft.timecraft.model.DeanCourse::getCourseId)
                                .toList();

                boolean subjectInManagedCourse = courseSubjectRepository
                                .findBySubjectId(subjectId)
                                .stream()
                                .anyMatch(cs -> managedCourseIds.contains(cs.getCourse().getId()));

                if (!subjectInManagedCourse) {
                        throw new IllegalStateException(
                                        "Subject does not belong to any of your managed courses");
                }

                User teacher = userRepository.findById(teacherId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Teacher not found: " + teacherId));
                User phUser = userRepository.findById(programHeadId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Program head not found: " + programHeadId));

                Section section = sectionRepository.findById(sectionId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Section not found: " + sectionId));

                // Upsert for the selected section
                SubjectAssignment assignment = subjectAssignmentRepository
                                .findBySubjectIdAndSectionIdAndSemesterAndSchoolYear(
                                                subjectId, sectionId, semester, schoolYear)
                                .orElse(SubjectAssignment.builder()
                                                .subject(subject)
                                                .section(section)
                                                .assignedBy(phUser)
                                                .semester(semester)
                                                .schoolYear(schoolYear)
                                                .build());

                assignment.setTeacher(teacher);
                assignment.setFinalized(false);
                SubjectAssignment saved = subjectAssignmentRepository.save(assignment);

                // Also upsert for ALL other sections that share this subject (same course, year
                // level, semester)
                courseSubjectRepository.findBySubjectId(subjectId).forEach(cs -> {
                        List<Section> relatedSections = sectionRepository
                                        .findByCourseIdAndYearLevelAndSemesterAndSchoolYear(
                                                        cs.getCourse().getId(),
                                                        cs.getYearLevel(),
                                                        com.timecraft.timecraft.model.CourseSubject.Semester
                                                                        .valueOf(semester),
                                                        schoolYear);
                        for (Section sec : relatedSections) {
                                if (sec.getId().equals(sectionId))
                                        continue; // already saved above
                                SubjectAssignment extra = subjectAssignmentRepository
                                                .findBySubjectIdAndSectionIdAndSemesterAndSchoolYear(
                                                                subjectId, sec.getId(), semester, schoolYear)
                                                .orElse(SubjectAssignment.builder()
                                                                .subject(subject)
                                                                .section(sec)
                                                                .assignedBy(phUser)
                                                                .semester(semester)
                                                                .schoolYear(schoolYear)
                                                                .build());
                                extra.setTeacher(teacher);
                                extra.setFinalized(false);
                                subjectAssignmentRepository.save(extra);
                        }
                });

                return saved;
        }

        @Transactional
        public SubjectAssignment finalizeAssignment(Long assignmentId,
                        Long programHeadId) {
                SubjectAssignment assignment = subjectAssignmentRepository
                                .findById(assignmentId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Assignment not found: " + assignmentId));

                if (!assignment.getAssignedBy().getId().equals(programHeadId)) {
                        throw new IllegalStateException(
                                        "You can only finalize your own assignments");
                }

                // Finalize all assignments for the same subject in the same term
                List<SubjectAssignment> all = subjectAssignmentRepository
                                .findBySubjectIdInAndSemesterAndSchoolYear(
                                                List.of(assignment.getSubject().getId()),
                                                assignment.getSemester(),
                                                assignment.getSchoolYear());
                all.forEach(a -> a.setFinalized(true));
                subjectAssignmentRepository.saveAll(all);

                return assignment;
        }

        @Transactional
        public void deleteAssignment(Long assignmentId, Long programHeadId) {
                SubjectAssignment assignment = subjectAssignmentRepository
                                .findById(assignmentId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Assignment not found: " + assignmentId));
                if (!assignment.getAssignedBy().getId().equals(programHeadId)) {
                        throw new IllegalStateException(
                                        "You can only delete your own assignments");
                }
                if (assignment.isFinalized()) {
                        throw new IllegalStateException(
                                        "Cannot delete a finalized assignment");
                }
                subjectAssignmentRepository.delete(assignment);
        }

        // ── Curriculum management ─────────────────────────────────────────────────

        @Transactional
        public void addSubjectToCurriculum(Long courseId, Long subjectId,
                        short yearLevel,
                        com.timecraft.timecraft.model.CourseSubject.Semester semester,
                        boolean isShared) {

                if (courseSubjectRepository.existsByCourseIdAndSubjectId(courseId, subjectId)) {
                        // Already linked — silently return (idempotent re-link)
                        return;
                }

                Course course = courseRepository.findById(courseId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Course not found: " + courseId));

                Subject subject = subjectRepository.findById(subjectId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Subject not found: " + subjectId));

                courseSubjectRepository.save(
                                CourseSubject.builder()
                                                .course(course)
                                                .subject(subject)
                                                .yearLevel(yearLevel)
                                                .semester(semester)
                                                .isShared(isShared)
                                                .build());
        }

        @Transactional
        public void removeSubjectFromCurriculum(Long courseId, Long subjectId) {
                CourseSubject cs = courseSubjectRepository
                                .findByCourseIdAndSubjectId(courseId, subjectId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Subject not in this course's curriculum"));
                courseSubjectRepository.delete(cs);

        }

        // ── Teacher preferences (approval workflow) ───────────────────────────────

        public List<TeacherSubjectPreference> getPendingPreferences(
                        Long programHeadId, String semester, String schoolYear) {

                // Use managed courses (not department) — supports CCSE multi-PH
                List<Long> managedCourseIds = programHeadCourseRepository
                                .findByDeanUserId(programHeadId)
                                .stream()
                                .map(com.timecraft.timecraft.model.DeanCourse::getCourseId)
                                .toList();

                List<Long> subjectIds = courseSubjectRepository
                                .findByCourseIdIn(managedCourseIds)
                                .stream()
                                .map(cs -> cs.getSubject().getId())
                                .distinct()
                                .toList();

                if (subjectIds.isEmpty())
                        return List.of();

                return preferenceRepository
                                .findBySubjectIdInAndSemesterAndSchoolYear(
                                                subjectIds,
                                                com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester),
                                                schoolYear);
        }

        @Transactional
        public TeacherSubjectPreference reviewPreference(Long preferenceId,
                        Long programHeadId, Status decision) {

                TeacherSubjectPreference pref = preferenceRepository
                                .findById(preferenceId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Preference not found: " + preferenceId));

                User phUser = userRepository.findById(programHeadId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Program head not found: " + programHeadId));

                pref.setStatus(decision);
                pref.setReviewedBy(phUser);
                pref.setReviewedAt(LocalDateTime.now());

                // If approved — auto-create subject assignment
                if (decision == Status.APPROVED) {
                        // Do NOT auto-create assignment here — section is unknown at preference
                        // approval time.
                        // PH must explicitly call saveAssignment() after approval to bind teacher →
                        // section.
                        log.info("Preference {} approved for teacher {} on subject {} — " +
                                        "PH must finalize section assignment separately.",
                                        preferenceId,
                                        pref.getTeacher().getFullName(),
                                        pref.getSubject().getCode());
                }

                return preferenceRepository.save(pref);
        }

        public void assertManagesCourse(Long programHeadId, Long courseId) {
                boolean manages = programHeadCourseRepository
                                .findByDeanUserId(programHeadId)
                                .stream()
                                .anyMatch(phc -> phc.getCourseId().equals(courseId));
                if (!manages) {
                        throw new IllegalStateException(
                                        "You do not manage course: " + courseId);
                }
        }

        // ── Grouped preferences for PreferenceReview page ─────────────────────────

        public List<Map<String, Object>> getPreferencesGroupedBySubject(
                        Long programHeadId, String semester, String schoolYear) {

                List<TeacherSubjectPreference> prefs = getPendingPreferences(
                                programHeadId, semester, schoolYear);

                // Group by subject
                Map<Long, Map<String, Object>> grouped = new java.util.LinkedHashMap<>();

                for (TeacherSubjectPreference pref : prefs) {
                        Long subjectId = pref.getSubject().getId();
                        grouped.computeIfAbsent(subjectId, k -> {
                                Map<String, Object> entry = new java.util.LinkedHashMap<>();
                                entry.put("subjectId", subjectId);
                                entry.put("subjectCode", pref.getSubject().getCode());
                                entry.put("subjectName", pref.getSubject().getName());
                                entry.put("teachers", new java.util.ArrayList<>());
                                return entry;
                        });

                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> teachers = (List<Map<String, Object>>) grouped.get(subjectId)
                                        .get("teachers");

                        Map<String, Object> teacherEntry = new java.util.LinkedHashMap<>();
                        teacherEntry.put("preferenceId", pref.getId());
                        teacherEntry.put("teacherId", pref.getTeacher().getId());
                        teacherEntry.put("teacherName", pref.getTeacher().getFullName());
                        teacherEntry.put("status", pref.getStatus());
                        teachers.add(teacherEntry);
                }

                // Check existing assignments for this term
                List<Long> subjectIds = new java.util.ArrayList<>(grouped.keySet());
                List<SubjectAssignment> existing = subjectAssignmentRepository
                                .findBySubjectIdInAndSemesterAndSchoolYear(
                                                subjectIds, semester, schoolYear);

                for (SubjectAssignment sa : existing) {
                        Map<String, Object> entry = grouped.get(sa.getSubject().getId());
                        if (entry != null) {
                                entry.put("assignedTeacherId", sa.getTeacher().getId());
                                entry.put("assignedTeacherName", sa.getTeacher().getFullName());
                                entry.put("assignmentId", sa.getId());
                                entry.put("isFinalized", sa.isFinalized());
                        }
                }

                return new java.util.ArrayList<>(grouped.values());
        }

        public List<Course> getManagedCourses(Long programHeadId) {
                return programHeadCourseRepository.findByDeanUserId(programHeadId)
                                .stream()
                                .map(phc -> courseRepository.findById(phc.getCourseId()).orElse(null))
                                .filter(c -> c != null)
                                .toList();
        }

}