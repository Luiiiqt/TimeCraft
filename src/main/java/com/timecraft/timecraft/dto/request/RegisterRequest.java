package com.timecraft.timecraft.dto.request;

import com.timecraft.timecraft.model.User.UserType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    // ── Shared fields (both STUDENT and TEACHER) ──────────────────────────────

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "School ID is required")
    private String schoolId;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotNull(message = "User type is required")
    private UserType userType;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    // ── Student-only fields ───────────────────────────────────────────────────

    /** Required when userType = STUDENT */
    private Long courseId;

    /** Required when userType = STUDENT */
    private Short yearLevel;

    /**
     * Section letter e.g. "A", "B".
     * Must be null when isIrregular = true.
     * Required when isIrregular = false.
     */
    private String section;

    /**
     * TRUE  = irregular student (no fixed section).
     * FALSE = regular student (must have a section).
     * Defaults to false if not provided.
     */
    private boolean isIrregular = false;

    // ── Teacher-only fields ───────────────────────────────────────────────────

    /**
     * TRUE  = GE teacher who can teach at either campus.
     * FALSE = dept teacher locked to their college campus.
     * Defaults to false if not provided.
     */
    private boolean campusFlexible = false;

    /**
     * Optional preferred campus ID for GE (campus-flexible) teachers.
     * Ignored when campusFlexible = false.
     */
    private Long preferredCampusId;
}