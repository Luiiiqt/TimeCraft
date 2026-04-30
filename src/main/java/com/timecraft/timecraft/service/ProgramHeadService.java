package com.timecraft.timecraft.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.Course;
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.repository.CourseRepository;
import com.timecraft.timecraft.repository.CourseSubjectRepository;
import com.timecraft.timecraft.repository.DeanCourseRepository;
import com.timecraft.timecraft.repository.SubjectAssignmentRepository;
import com.timecraft.timecraft.repository.SubjectRepository;
import com.timecraft.timecraft.repository.TeacherSubjectPreferenceRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgramHeadService {

    private final DeanCourseRepository phCourseRepository;
    private final CourseRepository courseRepository;
    private final CourseSubjectRepository courseSubjectRepository;
    private final SubjectAssignmentRepository assignmentRepository;
    private final TeacherSubjectPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    

    // ── Courses ───────────────────────────────────────────────────────────────

    public List<Course> getManagedCourses(Long phUserId) {
        return phCourseRepository.findByDeanUserId(phUserId)
                .stream()
                .map(phc -> courseRepository.findById(phc.getCourseId())
                        .orElse(null))
                .filter(c -> c != null)
                .toList();
    }

    // ── Preferences grouped by subject ────────────────────────────────────────
    // Only shows subjects belonging to this PH's managed courses.
    // Each group includes teacher votes with their vacancy preferences.

    public List<Map<String, Object>> getPreferencesGroupedBySubject(
            Long phUserId, String semester, String schoolYear) {

        List<Long> managedCourseIds = phCourseRepository
                .findByDeanUserId(phUserId)
                .stream()
                .map(phc -> phc.getCourseId())
                .toList();

        if (managedCourseIds.isEmpty()) return List.of();

        List<Long> subjectIds = courseSubjectRepository
                .findByCourseIdIn(managedCourseIds)
                .stream()
                .map(cs -> cs.getSubject().getId())
                .distinct()
                .toList();

        if (subjectIds.isEmpty()) return List.of();

        List<TeacherSubjectPreference> prefs = preferenceRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        subjectIds,
                        com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester),
                        schoolYear);

        // Group by subject
        Map<Long, Map<String, Object>> grouped = new java.util.LinkedHashMap<>();

        for (TeacherSubjectPreference pref : prefs) {
            var s = pref.getSubject();
            Long subjectId = s.getId();

            grouped.computeIfAbsent(subjectId, k -> {
                Map<String, Object> subjectMap = new java.util.LinkedHashMap<>();
                subjectMap.put("id", s.getId());
                subjectMap.put("name", s.getName());
                subjectMap.put("code", s.getCode());
                subjectMap.put("subjectType", s.getSubjectType());
                subjectMap.put("sessionType", s.getSessionType());

                Map<String, Object> entry = new java.util.LinkedHashMap<>();
                entry.put("subject", subjectMap);
                entry.put("preferences", new java.util.ArrayList<>());
                entry.put("assigned", false);
                return entry;
            });

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> prefList =
                    (List<Map<String, Object>>) grouped.get(subjectId).get("preferences");

            Map<String, Object> teacherMap = new java.util.LinkedHashMap<>();
            teacherMap.put("id", pref.getId());
            teacherMap.put("teacher", Map.of(
                    "id", pref.getTeacher().getId(),
                    "fullName", pref.getTeacher().getFullName()));
            teacherMap.put("status", pref.getStatus());
            // Vacancy preference — shown as warning in PreferenceReview UI
            teacherMap.put("vacantDay",  pref.getVacantDay());
            teacherMap.put("vacantTime", pref.getVacantTime());
            prefList.add(teacherMap);
        }

        // Mark subjects that already have a finalized assignment
        if (!subjectIds.isEmpty()) {
            assignmentRepository
                    .findBySubjectIdInAndSemesterAndSchoolYear(
                            subjectIds, semester, schoolYear)
                    .stream()
                    .filter(SubjectAssignment::isFinalized)
                    .forEach(sa -> {
                        Map<String, Object> entry = grouped.get(sa.getSubject().getId());
                        if (entry != null) entry.put("assigned", true);
                    });
        }

        return new java.util.ArrayList<>(grouped.values());
    }

    // ── Assignments ───────────────────────────────────────────────────────────

    public List<SubjectAssignment> getAssignments(
            Long phUserId, String semester, String schoolYear) {
        return assignmentRepository
                .findByAssignedByIdAndSemesterAndSchoolYear(
                        phUserId, semester, schoolYear);
    }

    // PH assigns a teacher to a subject (no section — Dean handles sections).
    // Saves assignment for ALL sections of that subject in the same term.
    @Transactional
    public SubjectAssignment saveAssignment(
            Long phUserId, Long subjectId, Long teacherId,
            String semester, String schoolYear) {

        assertManagesCourse(phUserId, subjectId);

        com.timecraft.timecraft.model.Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId));
        com.timecraft.timecraft.model.User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found: " + teacherId));
        com.timecraft.timecraft.model.User phUser = userRepository.findById(phUserId)
                .orElseThrow(() -> new RuntimeException("User not found: " + phUserId));

        // Upsert: one subject-level assignment row (no section yet — Dean handles sections)
        SubjectAssignment assignment = assignmentRepository
                .findBySubjectIdAndSemesterAndSchoolYear(subjectId, semester, schoolYear)
                .orElse(SubjectAssignment.builder()
                        .subject(subject)
                        .assignedBy(phUser)
                        .semester(semester)
                        .schoolYear(schoolYear)
                        .build());

        assignment.setTeacher(teacher);
        assignment.setFinalized(false);
        return assignmentRepository.save(assignment);
    }

    @Transactional
    public SubjectAssignment finalizeAssignment(Long assignmentId, Long phUserId) {
        SubjectAssignment assignment = assignmentRepository
                .findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));

        if (!assignment.getAssignedBy().getId().equals(phUserId))
            throw new IllegalStateException("You can only finalize your own assignments");

        List<SubjectAssignment> all = assignmentRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        List.of(assignment.getSubject().getId()),
                        assignment.getSemester(),
                        assignment.getSchoolYear());
        all.forEach(a -> a.setFinalized(true));
        assignmentRepository.saveAll(all);

        return assignment;
    }

    // ── Guard ─────────────────────────────────────────────────────────────────

    private void assertManagesCourse(Long phUserId, Long subjectId) {
        List<Long> managedCourseIds = phCourseRepository
                .findByDeanUserId(phUserId)
                .stream()
                .map(phc -> phc.getCourseId())
                .toList();

        boolean belongs = courseSubjectRepository
                .findBySubjectId(subjectId)
                .stream()
                .anyMatch(cs -> managedCourseIds.contains(cs.getCourse().getId()));

        if (!belongs)
            throw new IllegalStateException(
                    "Subject does not belong to your managed courses");
    }
}