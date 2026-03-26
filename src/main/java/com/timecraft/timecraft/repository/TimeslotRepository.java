package com.timecraft.timecraft.repository;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.Timeslot;

@Repository
public interface TimeslotRepository extends JpaRepository<Timeslot, Long> {

        List<Timeslot> findByDayOfWeek(DayOfWeek dayOfWeek);

        List<Timeslot> findByDayOfWeekOrderBySlotNumberAsc(DayOfWeek dayOfWeek);

        Optional<Timeslot> findByDayOfWeekAndSlotNumber(DayOfWeek dayOfWeek,
                        short slotNumber);

        /**
         * Returns timeslots on a given day where a teacher is available
         * AND not already scheduled in the term.
         * No year-level restriction — checked globally per timeslot.
         */
        @Query("SELECT t FROM Timeslot t " +
                        "WHERE t.dayOfWeek = :day " +
                        "AND EXISTS (" +
                        "  SELECT ta FROM TeacherAvailability ta " +
                        "  WHERE ta.teacher.id = :teacherId " +
                        "  AND ta.timeslot = t AND ta.available = true) " +
                        "AND t.id NOT IN (" +
                        "  SELECT s.timeslot.id FROM Schedule s " +
                        "  WHERE s.teacher.id = :teacherId " +
                        "  AND s.semester = :semester AND s.schoolYear = :schoolYear " +
                        "  UNION " +
                        "  SELECT s2.timeslot2.id FROM Schedule s2 " +
                        "  WHERE s2.teacher.id = :teacherId " +
                        "  AND s2.semester = :semester AND s2.schoolYear = :schoolYear) " +
                        "ORDER BY t.slotNumber")
        List<Timeslot> findFreeTimeslotsForTeacher(
                        @Param("teacherId") Long teacherId,
                        @Param("day") DayOfWeek day,
                        @Param("semester") String semester,
                        @Param("schoolYear") String schoolYear);

        /**
         * Returns timeslots on a given day where a room is free
         * (not booked in either session slot) in the term.
         */
        @Query("SELECT t FROM Timeslot t " +
                        "WHERE t.dayOfWeek = :day " +
                        "AND t.id NOT IN (" +
                        "  SELECT s.timeslot.id FROM Schedule s " +
                        "  WHERE s.room.id = :roomId " +
                        "  AND s.semester = :semester AND s.schoolYear = :schoolYear " +
                        "  UNION " +
                        "  SELECT s2.timeslot2.id FROM Schedule s2 " +
                        "  WHERE s2.room.id = :roomId " +
                        "  AND s2.semester = :semester AND s2.schoolYear = :schoolYear) " +
                        "ORDER BY t.slotNumber")
        List<Timeslot> findFreeTimeslotsForRoom(
                        @Param("roomId") Long roomId,
                        @Param("day") DayOfWeek day,
                        @Param("semester") String semester,
                        @Param("schoolYear") String schoolYear);

        List<Timeslot> findAllByOrderByDayOfWeekAscSlotNumberAsc();
}