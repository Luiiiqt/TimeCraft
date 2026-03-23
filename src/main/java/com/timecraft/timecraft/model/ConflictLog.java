package com.timecraft.timecraft.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "conflict_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConflictLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The schedule entry involved in the conflict.
     * Can be NULL if the schedule was deleted after detection.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private Schedule schedule;

    @Enumerated(EnumType.STRING)
    @Column(name = "conflict_type", nullable = false, length = 30)
    private ConflictType conflictType;

    /** Human-readable explanation for admin review. */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** FALSE until an admin marks it resolved. */
    @Column(name = "resolved", nullable = false)
    @Builder.Default
    private boolean resolved = false;

    @CreationTimestamp
    @Column(name = "detected_at", nullable = false, updatable = false)
    private LocalDateTime detectedAt;

    /** Populated when an admin resolves the conflict. */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // ── Enum ──────────────────────────────────────────────────────────────────
    public enum ConflictType {
        /** Same teacher assigned to two rooms at the same timeslot. */
        TEACHER_DOUBLE_BOOKED,
        /** Same room assigned to two subjects at the same timeslot. */
        ROOM_DOUBLE_BOOKED,
        /** A student has two classes at the same time (via section or individual). */
        STUDENT_TIME_CONFLICT,
        /** Teacher is marked unavailable at the assigned timeslot. */
        TEACHER_UNAVAILABLE,
        /** Subject needs a lab but got a lecture room, or vice versa. */
        WRONG_ROOM_TYPE,
        /** Health-related course was scheduled at the wrong campus. */
        WRONG_CAMPUS
    }
}