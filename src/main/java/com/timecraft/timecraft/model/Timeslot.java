package com.timecraft.timecraft.model;

import java.time.DayOfWeek;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "timeslots", uniqueConstraints = @UniqueConstraint(name = "uq_timeslot_day_slot", columnNames = {
        "day_of_week", "slot_number" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Timeslot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** MONDAY through SATURDAY only. */
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 10)
    private DayOfWeek dayOfWeek;

    /** 1 = 07:30 AM, 7 = 04:30 PM (ends 06:00 PM). */
    @Column(name = "slot_number", nullable = false)
    private short slotNumber;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /** Human-readable label e.g. "Monday 7:30 AM – 9:00 AM". */
    @Column(name = "label", nullable = false, length = 60)
    private String label;

    /** Duration in minutes: 90 for standard slots, 60 for lecture-only hasLab subjects. */
    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private short durationMinutes = 90;
}