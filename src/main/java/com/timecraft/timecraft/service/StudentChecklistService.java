package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.dto.request.ChecklistRequest;
import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.StudentChecklist;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.StudentChecklistRepository;
import com.timecraft.timecraft.repository.SubjectRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentChecklistService {

    private final StudentChecklistRepository checklistRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    // ── Enroll ────────────────────────────────────────────────────────────────

    /**
     * Replaces the student's entire checklist for the given term.
     * Safe to call multiple times — re-enrollment wipes and rebuilds.
     */
    @Transactional
    public List<StudentChecklist> enroll(String email, ChecklistRequest request) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student not found: " + email));

        // Wipe previous entries for this term
        checklistRepository.deleteByStudentIdAndSemesterAndAcademicYear(
                student.getId(), request.getSemester(), request.getAcademicYear());

        // Build and save new entries
        List<StudentChecklist> entries = request.getSubjectIds().stream()
                .map(subjectId -> {
                    Subject subject = subjectRepository.findById(subjectId)
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Subject not found: " + subjectId));
                    return StudentChecklist.builder()
                            .student(student)
                            .subject(subject)
                            .semester(request.getSemester())
                            .academicYear(request.getAcademicYear())
                            .build();
                })
                .toList();

        List<StudentChecklist> saved = checklistRepository.saveAll(entries);
        log.info("Student {} enrolled in {} subjects for {} {}",
                email, saved.size(), request.getSemester(), request.getAcademicYear());
        return saved;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<StudentChecklist> getByStudent(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student not found: " + email));
        return checklistRepository.findByStudentId(student.getId());
    }

    public List<StudentChecklist> getBySemester(String semester, String academicYear) {
        return checklistRepository.findBySemesterAndAcademicYear(
                semester, academicYear);
    }

    public List<Object[]> getSubjectDemand(String semester, String academicYear) {
        return checklistRepository.findSubjectDemandBySemester(
                semester, academicYear);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(Long id) {
        if (!checklistRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "Checklist entry not found: " + id);
        }
        checklistRepository.deleteById(id);
    }
}