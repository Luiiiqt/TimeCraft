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

        if (managedCourseIds.isEmpty()) {
            return List.of();
        }

        List<Long> subjectIds = courseSubjectRepository
                .findByCourseIdIn(managedCourseIds)
                .stream()
                .filter(cs -> cs.getSubject().getSubjectType()
                == com.timecraft.timecraft.model.Subject.SubjectType.MAJOR)
                .map(cs -> cs.getSubject().getId())
                .distinct()
                .toList();

        if (subjectIds.isEmpty()) {
            return List.of();
        }

        // Include ALL curriculum subjects for this semester (not just ones with votes)
        List<com.timecraft.timecraft.model.CourseSubject> semesterSubjects
                = courseSubjectRepository.findByCourseIdIn(managedCourseIds)
                        .stream()
                        .filter(cs -> cs.getSemester()
                        == com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester))
                        .filter(cs -> cs.getSubject().getSubjectType()
                        == com.timecraft.timecraft.model.Subject.SubjectType.MAJOR)
                        .toList();

        List<TeacherSubjectPreference> prefs = preferenceRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        subjectIds,
                        com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester),
                        schoolYear);

        // Group by subject — seed with ALL semester subjects first
        Map<Long, Map<String, Object>> grouped = new java.util.LinkedHashMap<>();

        for (com.timecraft.timecraft.model.CourseSubject cs : semesterSubjects) {
            var s = cs.getSubject();
            grouped.computeIfAbsent(s.getId(), k -> {
                Map<String, Object> subjectMap = new java.util.LinkedHashMap<>();
                subjectMap.put("id", s.getId());
                subjectMap.put("name", s.getName());
                subjectMap.put("code", s.getCode());
                subjectMap.put("subjectType", s.getSubjectType());
                subjectMap.put("sessionType", s.getSessionType());
                subjectMap.put("hasLab", s.isHasLab());
                Map<String, Object> entry = new java.util.LinkedHashMap<>();
                entry.put("subject", subjectMap);
                entry.put("preferences", new java.util.ArrayList<>());
                entry.put("assigned", false);
                return entry;
            });
        }

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
            List<Map<String, Object>> prefList
                    = (List<Map<String, Object>>) grouped.get(subjectId).get("preferences");

            Map<String, Object> teacherMap = new java.util.LinkedHashMap<>();
            teacherMap.put("id", pref.getId());
            teacherMap.put("teacher", Map.of(
                    "id", pref.getTeacher().getId(),
                    "fullName", pref.getTeacher().getFullName()));
            teacherMap.put("status", pref.getStatus());
            // Vacancy preference — shown as warning in PreferenceReview UI
            teacherMap.put("vacantDay", pref.getVacantDay());
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
                        if (entry != null) {
                            entry.put("assigned", true);
                        }
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

        assertManagesSubject(phUserId, subjectId);

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

        // Allow the assignee OR a Dean/Admin to finalize
        // (removed strict ownership check — Dean can also finalize PH assignments)
        List<SubjectAssignment> all = assignmentRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        List.of(assignment.getSubject().getId()),
                        assignment.getSemester(),
                        assignment.getSchoolYear());
        all.forEach(a -> a.setFinalized(true));
        assignmentRepository.saveAll(all);

        preferenceRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        List.of(assignment.getSubject().getId()),
                        com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(assignment.getSemester()),
                        assignment.getSchoolYear())
                .stream()
                .filter(pref -> pref.getTeacher().getId().equals(assignment.getTeacher().getId()))
                .forEach(pref -> {
                    pref.setStatus(TeacherSubjectPreference.Status.APPROVED);
                    pref.setReviewedAt(java.time.LocalDateTime.now());
                    preferenceRepository.save(pref);
                });

        return assignment;
    }

    // ── Teachers ──────────────────────────────────────────────────────────────
    public List<com.timecraft.timecraft.model.User> getTeachersForManagedCourses(Long phUserId) {
        List<Long> managedCourseIds = phCourseRepository
                .findByDeanUserId(phUserId)
                .stream()
                .map(phc -> phc.getCourseId())
                .toList();

        if (managedCourseIds.isEmpty()) {
            return List.of();
        }

        // Get department IDs from managed courses
        List<Long> departmentIds = managedCourseIds.stream()
                .map(courseId -> courseRepository.findById(courseId).orElse(null))
                .filter(c -> c != null && c.getDepartment() != null)
                .map(c -> c.getDepartment().getId())
                .distinct()
                .toList();

        if (departmentIds.isEmpty()) {
            return List.of();
        }

        return userRepository.findAll().stream()
                .filter(u -> com.timecraft.timecraft.model.User.UserType.TEACHER == u.getUserType())
                .filter(u -> u.getTeacherProfile() != null
                && u.getTeacherProfile().getDepartment() != null
                && departmentIds.contains(u.getTeacherProfile().getDepartment().getId()))
                .toList();
    }

    // ── Guard ─────────────────────────────────────────────────────────────────
    public void assertManagesCourse(Long phUserId, Long courseId) {
        boolean manages = phCourseRepository
                .findByDeanUserId(phUserId)
                .stream()
                .anyMatch(phc -> phc.getCourseId().equals(courseId));
        if (!manages) {
            throw new IllegalStateException(
                    "You do not manage course: " + courseId);
        }
    }

    private void assertManagesSubject(Long phUserId, Long subjectId) {
        List<Long> managedCourseIds = phCourseRepository
                .findByDeanUserId(phUserId)
                .stream()
                .map(phc -> phc.getCourseId())
                .toList();

        boolean belongs = courseSubjectRepository
                .findBySubjectId(subjectId)
                .stream()
                .anyMatch(cs -> managedCourseIds.contains(cs.getCourse().getId()));

        if (!belongs) {
            // Fallback: check if subject exists at all (for Dean/Admin bypassing PH guard)
            boolean subjectExists = subjectRepository.existsById(subjectId);
            if (!subjectExists) {
                throw new IllegalStateException("Subject not found: " + subjectId);
            }
            // If subject exists but PH doesn't manage it, still block
            if (!managedCourseIds.isEmpty()) {
                throw new IllegalStateException(
                        "Subject does not belong to your managed courses");
            }
        }
    }
}
