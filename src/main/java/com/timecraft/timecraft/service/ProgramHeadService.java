package com.timecraft.timecraft.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.ProgramHeadProfile;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.SubjectAssignment;
import com.timecraft.timecraft.model.TeacherSubjectPreference;
import com.timecraft.timecraft.model.TeacherSubjectPreference.Status;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.ProgramHeadProfileRepository;
import com.timecraft.timecraft.repository.SectionRepository;
import com.timecraft.timecraft.repository.SubjectAssignmentRepository;
import com.timecraft.timecraft.repository.SubjectRepository;
import com.timecraft.timecraft.repository.TeacherSubjectPreferenceRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgramHeadService {

    private final ProgramHeadProfileRepository programHeadProfileRepository;
    private final SubjectAssignmentRepository  subjectAssignmentRepository;
    private final TeacherSubjectPreferenceRepository preferenceRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository    userRepository;
    private final SectionRepository sectionRepository;

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
        if (!subject.getDepartment().getId()
                .equals(ph.getDepartment().getId())) {
            throw new IllegalStateException(
                    "Subject does not belong to your department");
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

    // ── Teacher preferences (approval workflow) ───────────────────────────────

    public List<TeacherSubjectPreference> getPendingPreferences(
            Long programHeadId, String semester, String schoolYear) {

        ProgramHeadProfile ph = getProfile(programHeadId);

        // Get subject IDs in this program head's department
        List<Long> subjectIds = ph.getDepartment().getSubjects()
                .stream().map(s -> s.getId()).toList();

        return preferenceRepository
                .findBySubjectIdInAndSemesterAndSchoolYear(
                        subjectIds, semester, schoolYear);
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
            subjectAssignmentRepository
                    .findBySubjectIdAndSectionIdAndSemesterAndSchoolYear(
                            pref.getSubject().getId(),
                            null,   // section TBD — PH assigns after approval
                            pref.getSemester(),
                            pref.getSchoolYear())
                    .ifPresentOrElse(
                        existing -> {
                            existing.setTeacher(pref.getTeacher());
                            subjectAssignmentRepository.save(existing);
                        },
                        () -> subjectAssignmentRepository.save(
                            SubjectAssignment.builder()
                                .subject(pref.getSubject())
                                .teacher(pref.getTeacher())
                                .assignedBy(phUser)
                                .semester(pref.getSemester())
                                .schoolYear(pref.getSchoolYear())
                                // section assigned separately by PH after preference approval
                                .build())
                    );
        }

        return preferenceRepository.save(pref);
    }

    }