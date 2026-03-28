package com.timecraft.timecraft.dto.request;

import com.timecraft.timecraft.model.CourseSubject.Semester;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ScheduleGenerateRequest {

    /**
     * Semester to generate for.
     * Must be FIRST, SECOND, or SUMMER.
     */
    @NotNull(message = "Semester is required")
    private Semester semester;

    /**
     * Academic year in format "YYYY-YYYY" e.g. "2024-2025".
     */
    @NotBlank(message = "School year is required")
    private String schoolYear;

    /**
     * Optional — generate only for a specific section ID.
     * When null, generates for ALL active sections in the term.
     */
    private Long sectionId;

    /**
     * Optional — generate only for a specific course ID.
     * When null and sectionId is null, generates for all courses.
     */
    private Long courseId;

    /**
     * When true, clears all existing DRAFT entries and conflict logs
     * for this term before generating. Published entries are preserved.
     * Defaults to true.
     */
    private boolean clearDraftsFirst = true;

    /**
     * When true, auto-publishes all successfully generated schedules
     * (DRAFT → PUBLISHED) after generation completes.
     * Schedules with conflicts remain CONFLICTED regardless.
     * Defaults to false — admin reviews before publishing.
     */
    private boolean autoPublish = false;
}