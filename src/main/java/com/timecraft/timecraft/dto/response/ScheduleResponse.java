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

    private Short units;

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
    private String departmentName;

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

    /** TRUE if this is an online Saturday lecture */
// REPLACE WITH:
    /** TRUE if this is an online Saturday lecture */
    @com.fasterxml.jackson.annotation.JsonProperty("isOnline")
    private boolean isOnline;

    /** TRUE if session 1 (ts1) is online */
    @com.fasterxml.jackson.annotation.JsonProperty("isOnlineTs1")
    private boolean isOnlineTs1;

    /** TRUE if session 2 (ts2) is online */
    @com.fasterxml.jackson.annotation.JsonProperty("isOnlineTs2")
    private boolean isOnlineTs2;

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
                .sessionType(schedule.getSessionType() != null
                        ? schedule.getSessionType().name()
                        : schedule.getSubject().getSessionType().name())
                .units(schedule.getSubject().getUnits())

                // Teacher
                .teacherId(schedule.getTeacher() != null
                        ? schedule.getTeacher().getId() : null)
                .teacherName(schedule.getTeacher() != null
                        ? schedule.getTeacher().getFullName() : null)
                .teacherSchoolId(schedule.getTeacher() != null
                        ? schedule.getTeacher().getSchoolId() : null)

                // Room
                .roomId(schedule.getRoom() != null
                        ? schedule.getRoom().getId() : null)
                .roomName(schedule.getRoom() != null
                        ? schedule.getRoom().getName() : null)
                .roomNumber(schedule.getRoom() != null
                        ? schedule.getRoom().getRoomNumber() : null)
                .roomType(schedule.getRoom() != null
                        ? schedule.getRoom().getRoomType().name() : null)

                // Campus
                .campusId(schedule.getCampus() != null
                        ? schedule.getCampus().getId() : null)
                .campusName(schedule.getCampus() != null
                        ? schedule.getCampus().getName() : null)
                .campusCode(schedule.getCampus() != null
                        ? schedule.getCampus().getCode() : null)

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
                .departmentName(schedule.getSection() != null
                        && schedule.getSection().getCourse().getDepartment() != null
                        ? schedule.getSection().getCourse().getDepartment().getName() : null)

                // Session 1
                .timeslotId(schedule.getTimeslot() != null
                        ? schedule.getTimeslot().getId() : null)
                .day1(schedule.getTimeslot() != null
                        ? schedule.getTimeslot().getDayOfWeek().name() : null)
                .startTime1(schedule.getTimeslot() != null
                        ? schedule.getTimeslot().getStartTime().toString() : null)
                .endTime1(schedule.getTimeslot() != null
                        ? schedule.getTimeslot().getEndTime().toString() : null)
                .timeslotLabel1(schedule.getTimeslot() != null
                        ? schedule.getTimeslot().getLabel() : null)

                // Session 2
                .timeslot2Id(schedule.getTimeslot2() != null
                        ? schedule.getTimeslot2().getId() : null)
                .day2(schedule.getTimeslot2() != null
                        ? schedule.getTimeslot2().getDayOfWeek().name() : null)
                .startTime2(schedule.getTimeslot2() != null
                        ? schedule.getTimeslot2().getStartTime().toString() : null)
                .endTime2(schedule.getTimeslot2() != null
                        ? schedule.getTimeslot2().getEndTime().toString() : null)
                .timeslotLabel2(schedule.getTimeslot2() != null
                        ? schedule.getTimeslot2().getLabel() : null)

                // Term
                .semester(schedule.getSemester().getLabel())
                .schoolYear(schedule.getSchoolYear())

                // Status
                .status(schedule.getStatus().name())
                .isOnline(schedule.isOnline())
                .isOnlineTs1(schedule.isOnlineTs1())
                .isOnlineTs2(schedule.isOnlineTs2())

                .build();
    }
}