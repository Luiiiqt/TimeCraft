package com.timecraft.timecraft.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TeacherRequest {

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

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    /**
     * TRUE  = GE teacher — can teach at CLI or CHS.
     * FALSE = Dept teacher — locked to college campus.
     */
    private boolean campusFlexible = false;

    /**
     * Optional preferred campus for GE teachers.
     * Ignored when campusFlexible = false.
     */
    private Long preferredCampusId;
}