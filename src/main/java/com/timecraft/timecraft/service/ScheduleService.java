package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Campus;
import com.timecraft.timecraft.model.CourseSubject.Semester;
import com.timecraft.timecraft.model.Room;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.Schedule.ScheduleStatus;
import com.timecraft.timecraft.model.Section;
import com.timecraft.timecraft.model.StudentSchedule;
import com.timecraft.timecraft.model.StudentSchedule.AssignmentType;
import com.timecraft.timecraft.model.Subject;
import com.timecraft.timecraft.model.Timeslot;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.CampusRepository;
import com.timecraft.timecraft.repository.RoomRepository;
import com.timecraft.timecraft.repository.ScheduleRepository;
import com.timecraft.timecraft.repository.SectionRepository;
import com.timecraft.timecraft.repository.StudentProfileRepository;
import com.timecraft.timecraft.repository.StudentScheduleRepository;
import com.timecraft.timecraft.repository.SubjectRepository;
import com.timecraft.timecraft.repository.TimeslotRepository;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final StudentScheduleRepository studentScheduleRepository;
    private final SectionRepository sectionRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final TimeslotRepository timeslotRepository;
    private final UserRepository userRepository;
    private final CampusRepository campusRepository;
    private final StudentProfileRepository studentProfileRepository;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public Schedule findById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Schedule not found: " + id));
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    public List<Schedule> findByTerm(Semester semester, String schoolYear) {
        return scheduleRepository.findBySemesterAndSchoolYear(semester, schoolYear);
    }

    public List<Schedule> findBySection(Long sectionId, Semester semester,
            String schoolYear) {
        return scheduleRepository.findBySectionIdAndSemesterAndSchoolYear(
                sectionId, semester, schoolYear);
    }

    /**
     * Returns a teacher's full schedule across ALL year levels for a term.
     * Ordered by year level then timeslot.
     */
    public List<Schedule> findByTeacher(Long teacherId, Semester semester,
            String schoolYear) {
        return scheduleRepository.findFullLoadByTeacherAndTerm(
                teacherId, semester, schoolYear);
    }

    public List<Schedule> findByStudent(Long studentId, Semester semester,
            String schoolYear) {
        return scheduleRepository.findByStudentAndTerm(
                studentId, semester, schoolYear);
    }

    public List<Schedule> findByRoom(Long roomId, Semester semester,
            String schoolYear) {
        return scheduleRepository.findByRoomIdAndSemesterAndSchoolYear(
                roomId, semester, schoolYear);
    }

    public List<Schedule> findConflicted() {
        return scheduleRepository.findByStatus(ScheduleStatus.CONFLICTED);
    }

    // ── Back subjects for irregular students ──────────────────────────────────

    public List<Schedule> findBackSubjects(Long studentId,
            Semester semester, String schoolYear) {

        // Get student's current year level
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student not found: " + studentId));

        // Get student's profile to find year level
        // Back subjects = published schedules where section year_level < student year_level
        // and student is not already enrolled in them
        List<Long> alreadyEnrolled = studentScheduleRepository
                .findByStudentId(studentId)
                .stream()
                .map(ss -> ss.getSchedule().getId())
                .toList();

        return scheduleRepository
                .findPublishedBySemesterAndSchoolYear(semester, schoolYear)
                .stream()
                .filter(s -> s.getSection() != null)
                .filter(s -> s.getSection().getYearLevel() < getStudentYearLevel(student))
                .filter(s -> !alreadyEnrolled.contains(s.getId()))
                .toList();
    }

    private int getStudentYearLevel(User student) {
        return studentProfileRepository
                .findByUserId(student.getId())
                .map(p -> (int) p.getYearLevel())
                .orElse(2);
    }

    // ── Conflict checks ───────────────────────────────────────────────────────

    public boolean hasTeacherConflict(Long teacherId, Long timeslotId,
            Semester semester, String schoolYear) {
        return !scheduleRepository.findTeacherConflicts(
                teacherId, timeslotId, semester, schoolYear).isEmpty();
    }

    public boolean hasRoomConflict(Long roomId, Long timeslotId,
            Semester semester, String schoolYear) {
        return !scheduleRepository.findRoomConflicts(
                roomId, timeslotId, semester, schoolYear).isEmpty();
    }

    public boolean hasSectionConflict(Long sectionId, Long timeslotId,
            Semester semester, String schoolYear) {
        return !scheduleRepository.findSectionConflicts(
                sectionId, timeslotId, semester, schoolYear).isEmpty();
    }

    public boolean hasStudentConflict(Long studentId, Long timeslotId,
            Semester semester, String schoolYear) {
        return !studentScheduleRepository.findStudentTimeslotConflicts(
                studentId, timeslotId, semester, schoolYear).isEmpty();
    }

    // ── Manual create (admin override) ────────────────────────────────────────

    @Transactional
    public Schedule createManual(Long subjectId, Long roomId, Long teacherId,
            Long timeslotId, Long timeslot2Id,
            Long sectionId, Semester semester,
            String schoolYear, Long campusId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Subject not found: " + subjectId));
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Room not found: " + roomId));
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Teacher not found: " + teacherId));
        Timeslot ts1 = timeslotRepository.findById(timeslotId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Timeslot not found: " + timeslotId));
        Timeslot ts2 = timeslotRepository.findById(timeslot2Id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Timeslot2 not found: " + timeslot2Id));
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Section not found: " + sectionId));
        Campus campus = campusRepository.findById(campusId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Campus not found: " + campusId));

        if (ts1.getId().equals(ts2.getId())) {
            throw new IllegalArgumentException(
                    "Session 1 and session 2 must be different timeslots");
        }
        if (ts1.getDayOfWeek() == ts2.getDayOfWeek()) {
            throw new IllegalArgumentException(
                    "Session 1 and session 2 must be on different days");
        }

        Schedule schedule = Schedule.builder()
                .subject(subject)
                .room(room)
                .teacher(teacher)
                .timeslot(ts1)
                .timeslot2(ts2)
                .section(section)
                .semester(semester)
                .schoolYear(schoolYear)
                .campus(campus)
                .status(ScheduleStatus.DRAFT)
                .build();

        return scheduleRepository.save(schedule);
    }

    // ── Publish / unpublish ───────────────────────────────────────────────────

    @Transactional
    public Schedule publish(Long scheduleId) {
        Schedule schedule = findById(scheduleId);
        if (schedule.getStatus() == ScheduleStatus.CONFLICTED) {
            throw new IllegalStateException(
                    "Cannot publish a schedule with unresolved conflicts");
        }
        schedule.setStatus(ScheduleStatus.PUBLISHED);
        return scheduleRepository.save(schedule);
    }

    @Transactional
    public void publishAll(Semester semester, String schoolYear) {
        List<Schedule> drafts = scheduleRepository
                .findBySemesterAndSchoolYearAndStatus(
                        semester, schoolYear, ScheduleStatus.DRAFT);
        drafts.forEach(s -> s.setStatus(ScheduleStatus.PUBLISHED));
        scheduleRepository.saveAll(drafts);
    }

    // ── Irregular student assignment ──────────────────────────────────────────

    @Transactional
    public StudentSchedule assignIrregularStudent(Long studentId,
            Long scheduleId) {
        if (studentScheduleRepository.existsByStudentIdAndScheduleId(
                studentId, scheduleId)) {
            throw new IllegalStateException(
                    "Student is already assigned to this schedule");
        }

        Schedule schedule = findById(scheduleId);

        // Check both session timeslots for student conflicts
        if (hasStudentConflict(studentId, schedule.getTimeslot().getId(),
                schedule.getSemester(), schedule.getSchoolYear())) {
            throw new IllegalStateException(
                    "Student has a time conflict with session 1 of this schedule");
        }
        if (hasStudentConflict(studentId, schedule.getTimeslot2().getId(),
                schedule.getSemester(), schedule.getSchoolYear())) {
            throw new IllegalStateException(
                    "Student has a time conflict with session 2 of this schedule");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student not found: " + studentId));

        return studentScheduleRepository.save(StudentSchedule.builder()
                .student(student)
                .schedule(schedule)
                .assignmentType(AssignmentType.IRREGULAR)
                .build());
    }

    @Transactional
    public void removeIrregularStudent(Long studentId, Long scheduleId) {
        StudentSchedule ss = studentScheduleRepository
                .findByStudentIdAndScheduleId(studentId, scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Assignment not found for student " + studentId +
                                " and schedule " + scheduleId));
        studentScheduleRepository.delete(ss);
    }

    // ── Lock check ────────────────────────────────────────────────────────────

    public boolean isLockedForCourse(Long courseId, Semester semester,
            String schoolYear) {
        return scheduleRepository
                .existsBySectionCourseIdAndSemesterAndSchoolYearAndStatus(
                        courseId, semester, schoolYear, ScheduleStatus.PUBLISHED);
    }

    // ── Reporting ─────────────────────────────────────────────────────────────

    public List<Object[]> getTeachingLoadReport(Semester semester,
            String schoolYear) {
        return scheduleRepository.getTeachingLoadReport(semester, schoolYear);
    }

    public List<Object[]> getTeacherLoadByYearLevel(Long teacherId,
            Semester semester,
            String schoolYear) {
        return scheduleRepository.countClassesByYearLevelForTeacher(
                teacherId, semester, schoolYear);
    }
}