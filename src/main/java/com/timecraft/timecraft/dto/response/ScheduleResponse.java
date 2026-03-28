package com.timecraft.timecraft.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.timecraft.timecraft.model.Schedule;

import lombok.Builder;
import lombok.Data;

/**
 * Returned whenever a schedule entry is included in an API response.
 *
 * Used for:
 *   - Student timetable view
 *   - Teacher timetable view (spans all year levels)
 *   - Admin schedule management
 *   - Room booking view
 *
 * All nested IDs are included so the frontend can link to
 * related resources without additional API calls.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScheduleResponse {

    private Long   id;

    // ── Subject ───────────────────────────────────────────────────────────────

    private Long   subjectId;
    private String subjectCode;
    private String subjectName;

    /** MAJOR or MINOR */
    private String subjectType;

    /** LECTURE or LABORATORY */
    private String sessionType;

    // ── Teacher ───────────────────────────────────────────────────────────────

    private Long   teacherId;
    private String teacherName;
    private String teacherSchoolId;

    // ── Room ──────────────────────────────────────────────────────────────────

    private Long   roomId;
    private String roomName;
    private String roomNumber;

    /** LECTURE or LABORATORY */
    private String roomType;

    // ── Campus ────────────────────────────────────────────────────────────────

    private Long   campusId;
    private String campusName;
    private String campusCode;

    // ── Section ───────────────────────────────────────────────────────────────

    private Long   sectionId;
    private String sectionName;
    private Short  yearLevel;
    private String courseCode;
    private String courseName;

    // ── Session 1 timeslot ────────────────────────────────────────────────────

    private Long   timeslotId;
    private String day1;
    private String startTime1;
    private String endTime1;
    private String timeslotLabel1;

    // ── Session 2 timeslot ────────────────────────────────────────────────────

    private Long   timeslot2Id;
    private String day2;
    private String startTime2;
    private String endTime2;
    private String timeslotLabel2;

    // ── Term ──────────────────────────────────────────────────────────────────

    private String semester;
    private String schoolYear;

    // ── Status ────────────────────────────────────────────────────────────────

    /** DRAFT, PUBLISHED, or CONFLICTED */
    private String status;

    // ── Static mapper ─────────────────────────────────────────────────────────

    /**
     * Maps a Schedule entity to a ScheduleResponse DTO.
     * Called from service or controller layer — keeps mapping logic out of entities.
     */
    public static ScheduleResponse from(Schedule schedule) {
        return ScheduleResponse.builder()
                .id(schedule.getId())

                // Subject
                .subjectId(schedule.getSubject().getId())
                .subjectCode(schedule.getSubject().getCode())
                .subjectName(schedule.getSubject().getName())
                .subjectType(schedule.getSubject().getSubjectType().name())
                .sessionType(schedule.getSubject().getSessionType().name())

                // Teacher
                .teacherId(schedule.getTeacher().getId())
                .teacherName(schedule.getTeacher().getFullName())
                .teacherSchoolId(schedule.getTeacher().getSchoolId())

                // Room
                .roomId(schedule.getRoom().getId())
                .roomName(schedule.getRoom().getName())
                .roomNumber(schedule.getRoom().getRoomNumber())
                .roomType(schedule.getRoom().getRoomType().name())

                // Campus
                .campusId(schedule.getCampus().getId())
                .campusName(schedule.getCampus().getName())
                .campusCode(schedule.getCampus().getCode())

                // Section
                .sectionId(schedule.getSection() != null
                        ? schedule.getSection().getId() : null)
                .sectionName(schedule.getSection() != null
                        ? schedule.getSection().getSectionName() : null)
                .yearLevel(schedule.getSection() != null
                        ? schedule.getSection().getYearLevel() : null)
                .courseCode(schedule.getSection() != null
                        ? schedule.getSection().getCourse().getCode() : null)
                .courseName(schedule.getSection() != null
                        ? schedule.getSection().getCourse().getName() : null)

                // Session 1
                .timeslotId(schedule.getTimeslot().getId())
                .day1(schedule.getTimeslot().getDayOfWeek().name())
                .startTime1(schedule.getTimeslot().getStartTime().toString())
                .endTime1(schedule.getTimeslot().getEndTime().toString())
                .timeslotLabel1(schedule.getTimeslot().getLabel())

                // Session 2
                .timeslot2Id(schedule.getTimeslot2().getId())
                .day2(schedule.getTimeslot2().getDayOfWeek().name())
                .startTime2(schedule.getTimeslot2().getStartTime().toString())
                .endTime2(schedule.getTimeslot2().getEndTime().toString())
                .timeslotLabel2(schedule.getTimeslot2().getLabel())

                // Term
                .semester(schedule.getSemester().getLabel())
                .schoolYear(schedule.getSchoolYear())

                // Status
                .status(schedule.getStatus().name())

                .build();
    }
}