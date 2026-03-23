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
@Table(
    name = "timeslots",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_timeslot_day_slot",
        columnNames = {"day_of_week", "slot_number"}
    )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Timeslot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Day of the week — MONDAY through SATURDAY only.
     * Sunday is not part of the scheduling window.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 10)
    private DayOfWeek dayOfWeek;

    /**
     * Ordered slot within the day.
     * 1 = 07:30, 2 = 09:00, ... 7 = 16:30 (ends 18:00).
     */
    @Column(name = "slot_number", nullable = false)
    private short slotNumber;

    /** Start of the 90-minute block e.g. 07:30. */
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    /** End of the 90-minute block e.g. 09:00. */
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /** Human-readable label e.g. "Monday 7:30 AM – 9:00 AM". */
    @Column(name = "label", nullable = false, length = 60)
    private String label;
}