package com.timecraft.timecraft.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.CourseSubject;
import com.timecraft.timecraft.model.ProgramHeadProfile;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.model.TeacherSubjectPreference.Status;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.CourseSubjectRepository;
import com.timecraft.timecraft.repository.ProgramHeadProfileRepository;
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
public class ProgramHeadService {

        private final ProgramHeadProfileRepository programHeadProfileRepository;
        private final SubjectAssignmentRepository subjectAssignmentRepository;
        private final TeacherSubjectPreferenceRepository preferenceRepository;
        private final SubjectRepository subjectRepository;
        private final UserRepository userRepository;
        private final SectionRepository sectionRepository;
        private final CourseSubjectRepository courseSubjectRepository;
        private final CourseRepository courseRepository;
        private final com.timecraft.timecraft.repository.ProgramHeadCourseRepository programHeadCourseRepository;

        // ── Profile ───────────────────────────────────────────────────────────────

        public ProgramHeadProfile getProfile(Long userId) {
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

                ProgramHeadProfile ph = getProfile(programHeadId);

                Subject subject = subjectRepository.findById(subjectId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Subject not found: " + subjectId));

                // Data isolation — subject must belong to program head's department
                List<Long> managedCourseIds = programHeadCourseRepository
                                .findByPhUserId(programHeadId)
                                .stream()
                                .map(phc -> phc.getCourseId())
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

                // Upsert — update if exists, create if not
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
                return subjectAssignmentRepository.save(assignment);
        }

        @Transactional
        public SubjectAssignment finalizeAssignment(Long assignmentId,
                        Long programHeadId) {
                SubjectAssignment assignment = subjectAssignmentRepository
                                .findById(assignmentId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Assignment not found: " + assignmentId));

                // Verify ownership
                if (!assignment.getAssignedBy().getId().equals(programHeadId)) {
                        throw new IllegalStateException(
                                        "You can only finalize your own assignments");
                }

                assignment.setFinalized(true);
                return subjectAssignmentRepository.save(assignment);
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
                                .findByPhUserId(programHeadId)
                                .stream()
                                .map(phc -> phc.getCourseId())
                                .toList();

                List<Long> subjectIds = courseSubjectRepository
                                .findByCourseIdIn(managedCourseIds)
                                .stream()
                                .map(cs -> cs.getSubject().getId())
                                .distinct()
                                .toList();

                if (subjectIds.isEmpty()) return List.of();

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
                                .findByPhUserId(programHeadId)
                                .stream()
                                .anyMatch(phc -> phc.getCourseId().equals(courseId));
                if (!manages) {
                        throw new IllegalStateException(
                                        "You do not manage course: " + courseId);
                }
        }

        public List<Course> getManagedCourses(Long programHeadId) {
                return programHeadCourseRepository.findByPhUserId(programHeadId)
                                .stream()
                                .map(phc -> courseRepository.findById(phc.getCourseId()).orElse(null))
                                .filter(c -> c != null)
                                .toList();
        }

}