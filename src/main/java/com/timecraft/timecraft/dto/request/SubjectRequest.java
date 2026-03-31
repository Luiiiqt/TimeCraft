package com.timecraft.timecraft.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubjectRequest {

    @NotBlank(message = "Subject name is required")
    @Size(max = 200)
    private String name;

    @NotBlank(message = "Subject code is required")
    @Size(max = 30)
    private String code;

    @NotNull(message = "Subject type is required (MAJOR or MINOR)")
    private String subjectType;

    @NotNull(message = "Session type is required (LECTURE or LABORATORY)")
    private String sessionType;

    @NotNull(message = "Units is required")
    @Min(value = 1, message = "Units must be at least 1")
    private Short units;

    /**
     * Name of the prerequisite subject, or null if none.
     * e.g. "Calculus 1" or "IT-DSA"
     */
    private String prerequisite;

    @NotNull(message = "Department ID is required")
    private Long departmentId;
}