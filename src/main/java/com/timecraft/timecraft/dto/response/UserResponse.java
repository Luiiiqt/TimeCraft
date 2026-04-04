package com.timecraft.timecraft.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.timecraft.timecraft.model.User;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private Long   id;
    private String fullName;
    private String schoolId;
    private String email;
    private String role;
    private boolean isActive;

    // ── Student fields ────────────────────────────────────────────────────────

    private Long    departmentId;
    private String  departmentName;
    private Long    courseId;
    private String  courseCode;
    private String  courseName;
    private Short   yearLevel;
    private String  section;
    private Long    sectionId;
    private Boolean isIrregular;

    // ── Teacher fields ────────────────────────────────────────────────────────

    private Boolean campusFlexible;
    private String  preferredCampusCode;

    // ── Static mapper ─────────────────────────────────────────────────────────

    public static UserResponse from(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .schoolId(user.getSchoolId())
                .email(user.getEmail())
                .role(user.getUserType().name())
                .isActive(user.isActive());

        if (user.getStudentProfile() != null) {
            var sp = user.getStudentProfile();
            builder
                .departmentId(sp.getDepartment().getId())
                .departmentName(sp.getDepartment().getName())
                .courseId(sp.getCourse().getId())
                .courseCode(sp.getCourse().getCode())
                .courseName(sp.getCourse().getName())
                .yearLevel(sp.getYearLevel())
                .section(sp.getSection())
                .isIrregular(sp.isIrregular());

            // Resolve sectionId from sections table
            // sp.getSection() is a label like "A" — we need the actual Section.id
            // This is populated by AuthController after login via SectionRepository
        }

        if (user.getTeacherProfile() != null) {
            var tp = user.getTeacherProfile();
            builder
                .departmentId(tp.getDepartment().getId())
                .departmentName(tp.getDepartment().getName())
                .campusFlexible(tp.isCampusFlexible())
                .preferredCampusCode(tp.getPreferredCampus() != null
                        ? tp.getPreferredCampus().getCode() : null);
        }

        return builder.build();
    }
}