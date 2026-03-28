package com.timecraft.timecraft.dto.request;

import com.timecraft.timecraft.model.CourseSubject.Semester;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScheduleRequest {

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Teacher ID is required")
    private Long teacherId;

    @NotNull(message = "Timeslot ID (session 1) is required")
    private Long timeslotId;

    @NotNull(message = "Timeslot ID (session 2) is required")
    private Long timeslot2Id;

    @NotNull(message = "Section ID is required")
    private Long sectionId;

    @NotNull(message = "Campus ID is required")
    private Long campusId;

    @NotNull(message = "Semester is required")
    private Semester semester;

    @NotBlank(message = "School year is required")
    private String schoolYear;
}