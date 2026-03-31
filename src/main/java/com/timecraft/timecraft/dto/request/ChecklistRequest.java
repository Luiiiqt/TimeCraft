package com.timecraft.timecraft.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class ChecklistRequest {

    @NotBlank(message = "Semester is required (1ST, 2ND, SUMMER)")
    private String semester;

    @NotBlank(message = "Academic year is required e.g. 2024-2025")
    private String academicYear;

    /**
     * List of subject IDs the student is enrolling in this semester.
     * Replaces any previous checklist entries for the same term.
     */
    @NotEmpty(message = "At least one subject must be selected")
    private List<Long> subjectIds;
}