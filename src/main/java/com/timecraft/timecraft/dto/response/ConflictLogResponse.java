package com.timecraft.timecraft.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.timecraft.timecraft.model.ConflictLog;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConflictLogResponse {

    private Long          id;
    private Long          scheduleId;
    private String        conflictType;
    private String        description;
    private boolean       resolved;
    private LocalDateTime detectedAt;
    private LocalDateTime resolvedAt;

    // ── Subject info for context ──────────────────────────────────────────────
    private String subjectCode;
    private String subjectName;

    // ── Section info for context ──────────────────────────────────────────────
    private String sectionLabel;

    // ── Teacher info for context ──────────────────────────────────────────────
    private String teacherName;

    // ── Static mapper ─────────────────────────────────────────────────────────

    public static ConflictLogResponse from(ConflictLog log) {
        ConflictLogResponse.ConflictLogResponseBuilder builder =
                ConflictLogResponse.builder()
                        .id(log.getId())
                        .conflictType(log.getConflictType().name())
                        .description(log.getDescription())
                        .resolved(log.isResolved())
                        .detectedAt(log.getDetectedAt())
                        .resolvedAt(log.getResolvedAt());

        if (log.getSchedule() != null) {
            builder.scheduleId(log.getSchedule().getId());

            if (log.getSchedule().getSubject() != null) {
                builder
                    .subjectCode(log.getSchedule().getSubject().getCode())
                    .subjectName(log.getSchedule().getSubject().getName());
            }

            if (log.getSchedule().getSection() != null) {
                builder.sectionLabel(
                        log.getSchedule().getSection().getDisplayLabel());
            }

            if (log.getSchedule().getTeacher() != null) {
                builder.teacherName(
                        log.getSchedule().getTeacher().getFullName());
            }
        }

        return builder.build();
    }
}