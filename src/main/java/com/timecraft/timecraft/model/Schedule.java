package com.timecraft.timecraft.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "schedules", uniqueConstraints = {
                @UniqueConstraint(name = "uq_schedules_room_ts1", columnNames = { "room_id", "timeslot_id", "semester",
                                "school_year" }),
                @UniqueConstraint(name = "uq_schedules_room_ts2", columnNames = { "room_id", "timeslot2_id", "semester",
                                "school_year" }),
                @UniqueConstraint(name = "uq_schedules_teacher_ts1", columnNames = { "teacher_id", "timeslot_id",
                                "semester",
                                "school_year" }),
                @UniqueConstraint(name = "uq_schedules_teacher_ts2", columnNames = { "teacher_id", "timeslot2_id",
                                "semester",
                                "school_year" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "subject_id", nullable = false)
        private Subject subject;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "room_id", nullable = false)
        private Room room;

        /**
         * Teacher assigned to this schedule entry.
         * No year-level restriction — any teacher can be assigned to any year level.
         * Only constraint: no duplicate (teacher, timeslot, semester, school_year).
         */
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "teacher_id", nullable = false)
        private User teacher;

        /** First weekly session e.g. Monday 7:30–9:00 AM. */
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "timeslot_id", nullable = false)
        private Timeslot timeslot;

        /** Second weekly session — must be a different day. */
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "timeslot2_id", nullable = false)
        private Timeslot timeslot2;

        /** Block section. NULL for irregular-only open classes. */
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "section_id")
        private Section section;

        @Enumerated(EnumType.STRING)
        @Column(name = "semester", nullable = false, length = 10)
        private CourseSubject.Semester semester;

        /** Academic year e.g. "2024-2025". */
        @Column(name = "school_year", nullable = false, length = 10)
        private String schoolYear;

        /**
         * Campus where this class is held.
         * Health courses → CHS. CCSE/Business/Psychology → CLI.
         * GE teachers can appear on either campus.
         */
        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "campus_id", nullable = false)
        private Campus campus;

        @Enumerated(EnumType.STRING)
        @Column(name = "status", nullable = false, length = 15)
        @Builder.Default
        private ScheduleStatus status = ScheduleStatus.DRAFT;

        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
        @Builder.Default
        private List<StudentSchedule> studentSchedules = new ArrayList<>();

        @OneToMany(mappedBy = "schedule", fetch = FetchType.LAZY)
        @Builder.Default
        private List<ConflictLog> conflictLogs = new ArrayList<>();

        public enum ScheduleStatus {
                DRAFT, PUBLISHED, CONFLICTED
        }

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "merged_section_id")
        private MergedSection mergedSection;
}