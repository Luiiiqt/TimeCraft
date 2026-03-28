package com.timecraft.timecraft.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

/**
 * Returned by POST /api/v1/auth/login
 *
 * Contains the JWT and all profile information the frontend
 * needs to render the dashboard without a second API call.
 *
 * Fields prefixed with student* are null for teachers.
 * Fields prefixed with teacher* are null for students.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    // ── Token ─────────────────────────────────────────────────────────────────

    private String token;

    @Builder.Default
    private String tokenType = "Bearer";

    // ── Shared user fields ────────────────────────────────────────────────────

    private Long   userId;
    private String email;
    private String schoolId;
    private String fullName;

    /** STUDENT or TEACHER */
    private String role;

    private Long   departmentId;
    private String departmentName;

    // ── Student-only fields ───────────────────────────────────────────────────

    private Long    courseId;
    private String  courseCode;
    private String  courseName;
    private Short   yearLevel;
    private String  section;
    private Boolean isIrregular;

    // ── Teacher-only fields ───────────────────────────────────────────────────

    private Boolean campusFlexible;
    private Long    preferredCampusId;
    private String  preferredCampusCode;
}