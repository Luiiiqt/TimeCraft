package com.timecraft.timecraft.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.dto.response.ScheduleResponse;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.ScheduleRepository;
import com.timecraft.timecraft.repository.SubjectAssignmentRepository;
import com.timecraft.timecraft.repository.SubjectRepository;
import com.timecraft.timecraft.repository.TeacherSubjectPreferenceRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GECoordinatorService {

    private final TeacherSubjectPreferenceRepository preferenceRepository;
    private final SubjectAssignmentRepository        assignmentRepository;
    private final SubjectRepository                  subjectRepository;
    private final UserRepository                     userRepository;
    private final ScheduleRepository                 scheduleRepository;
    private final com.timecraft.timecraft.repository.TeacherProfileRepository teacherProfileRepository;

    // Only MINOR subjects visible to GE Coordinator
    public List<Map<String, Object>> getMinorPreferencesGrouped(
            Long coordinatorId, String semester, String schoolYear) {

        // Load ALL active MINOR subjects first
        com.timecraft.timecraft.model.CourseSubject.Semester semesterEnum =
                com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester);

        List<Subject> minorSubjects = subjectRepository.findByIsActiveTrue()
                .stream()
                .filter(s -> s.getSubjectType() == Subject.SubjectType.MINOR)
                .filter(s -> s.getCourseSubjects().stream()
                        .anyMatch(cs -> cs.getSemester() == semesterEnum))
                .toList();

        if (minorSubjects.isEmpty()) return List.of();

        List<Long> minorSubjectIds = minorSubjects.stream().map(Subject::getId).toList();

        // Load teacher votes for these subjects
        List<TeacherSubjectPreference> prefs = preferenceRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        minorSubjectIds,
                        com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester),
                        schoolYear);

        // Build grouped map seeded with ALL minor subjects (even zero votes)
        Map<Long, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (Subject s : minorSubjects) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("subject", Map.of(
                    "id", s.getId(), "name", s.getName(),
                    "code", s.getCode(), "subjectType", s.getSubjectType(),
                    "sessionType", s.getSessionType()));
            entry.put("preferences", new ArrayList<>());
            entry.put("assigned", false);
            grouped.put(s.getId(), entry);
        }

        // Attach teacher votes
        for (TeacherSubjectPreference pref : prefs) {
            Subject s = pref.getSubject();
            if (!grouped.containsKey(s.getId())) continue;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> prefList =
                    (List<Map<String, Object>>) grouped.get(s.getId()).get("preferences");

            prefList.add(Map.of(
                    "id", pref.getId(),
                    "teacher", Map.of("id", pref.getTeacher().getId(),
                            "fullName", pref.getTeacher().getFullName()),
                    "status", pref.getStatus(),
                    "vacantDay",  pref.getVacantDay()  != null ? pref.getVacantDay()  : "",
                    "vacantTime", pref.getVacantTime() != null ? pref.getVacantTime() : ""));
        }

        // Mark already-assigned subjects
        assignmentRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        minorSubjectIds, semester, schoolYear)
                .stream().filter(SubjectAssignment::isFinalized)
                .forEach(sa -> {
                    Map<String, Object> entry = grouped.get(sa.getSubject().getId());
                    if (entry != null) {
                        entry.put("assigned", true);
                        entry.put("assignedTeacher", sa.getTeacher().getFullName());
                    }
                });

        return new ArrayList<>(grouped.values());
    }

    @Transactional
    public SubjectAssignment assignAndFinalize(
            Long coordinatorId, Long subjectId, Long teacherId,
            String semester, String schoolYear) {

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        // Guard: only MINOR subjects
        if (subject.getSubjectType() != Subject.SubjectType.MINOR) {
            throw new IllegalStateException(
                    "GE Coordinator can only assign MINOR subjects");
        }

        User teacher     = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        User coordinator = userRepository.findById(coordinatorId)
                .orElseThrow(() -> new RuntimeException("Coordinator not found"));

        SubjectAssignment assignment = assignmentRepository
                .findBySubjectIdAndSemesterAndSchoolYear(subjectId, semester, schoolYear)
                .orElse(SubjectAssignment.builder()
                        .subject(subject)
                        .assignedBy(coordinator)
                        .semester(semester)
                        .schoolYear(schoolYear)
                        .build());

        assignment.setTeacher(teacher);
        assignment.setFinalized(true);
        return assignmentRepository.save(assignment);
    }

    public List<SubjectAssignment> getAssignments(
            Long coordinatorId, String semester, String schoolYear) {
        return assignmentRepository
                .findByAssignedByIdAndSemesterAndSchoolYear(
                        coordinatorId, semester, schoolYear)
                .stream()
                .filter(a -> a.getSubject().getSubjectType() == Subject.SubjectType.MINOR)
                .toList();
    }

    public List<com.timecraft.timecraft.model.User> getGETeachers() {
        return teacherProfileRepository.findAllGETeachers()
                .stream()
                .map(tp -> tp.getUser())
                .distinct()
                .toList();
    }

    public List<ScheduleResponse> getPublishedSchedule(
            Long sectionId, String semester, String schoolYear) {
        return scheduleRepository
                .findBySectionIdAndSemesterAndSchoolYear(
                        sectionId,
                        com.timecraft.timecraft.model.CourseSubject.Semester.valueOf(semester),
                        schoolYear)
                .stream()
                .filter(s -> s.getStatus() == Schedule.ScheduleStatus.PUBLISHED)
                .filter(s -> s.getSubject().getSubjectType() == Subject.SubjectType.MINOR)
                .map(ScheduleResponse::from)
                .toList();
    }
}