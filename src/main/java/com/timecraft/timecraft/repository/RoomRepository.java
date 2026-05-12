package com.timecraft.timecraft.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.Room;
import com.timecraft.timecraft.model.Room.RoomType;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

        // ── Basic filters ─────────────────────────────────────────────────────────

        List<Room> findByCampusId(Long campusId);

        List<Room> findByRoomType(RoomType roomType);

        List<Room> findByCampusIdAndRoomType(Long campusId, RoomType roomType);

        List<Room> findByCampusIdAndIsActiveTrue(Long campusId);

        List<Room> findByCampusIdAndRoomTypeAndIsActiveTrue(Long campusId,
                        RoomType roomType);

        List<Room> findByCapacityGreaterThanEqualAndIsActiveTrue(int minCapacity);

        List<Room> findByCampusIdAndRoomTypeAndCapacityGreaterThanEqualAndIsActiveTrue(
                        Long campusId, RoomType roomType, int minCapacity);

        // ── Scheduling engine: campus-locked room lookup ──────────────────────────

        /**
         * Returns available rooms for dept teachers locked to a specific campus.
         * Filters by campus, room type, min capacity, and excludes rooms already
         * booked in either session timeslot for the given term.
         */
        @Query(value = "SELECT r.* FROM rooms r " +
        "WHERE r.campus_id = :campusId " +
        "AND r.room_type = :#{#roomType.name()} " +
        "AND r.capacity >= :minCapacity " +
        "AND r.is_active = true " +
        "AND r.id NOT IN (" +
        "  SELECT s.room_id FROM schedules s " +
        "  LEFT JOIN timeslots ts1 ON ts1.id = s.timeslot_id " +
        "  LEFT JOIN timeslots ts2 ON ts2.id = s.timeslot2_id " +
        "  JOIN timeslots chk1 ON chk1.id = :timeslotId " +
        "  JOIN timeslots chk2 ON chk2.id = :timeslot2Id " +
        "  WHERE s.room_id IS NOT NULL " +
        "  AND s.status <> 'CONFLICTED' " +
        "  AND s.semester = :semester AND s.school_year = :schoolYear " +
        "  AND (" +
        "    (ts1.day_of_week = chk1.day_of_week AND ts1.start_time < chk1.end_time AND chk1.start_time < ts1.end_time) " +
        "    OR (ts2.day_of_week = chk1.day_of_week AND ts2.start_time < chk1.end_time AND chk1.start_time < ts2.end_time) " +
        "    OR (ts1.day_of_week = chk2.day_of_week AND ts1.start_time < chk2.end_time AND chk2.start_time < ts1.end_time) " +
        "    OR (ts2.day_of_week = chk2.day_of_week AND ts2.start_time < chk2.end_time AND chk2.start_time < ts2.end_time)" +
        "  )" +
        ") " +
        "ORDER BY RANDOM()",
        nativeQuery = true)
List<Room> findAvailableRooms(
        @Param("campusId") Long campusId,
        @Param("roomType") RoomType roomType,
        @Param("minCapacity") int minCapacity,
        @Param("timeslotId") Long timeslotId,
        @Param("timeslot2Id") Long timeslot2Id,
        @Param("semester") String semester,
        @Param("schoolYear") String schoolYear);

@Query(value = "SELECT r.* FROM rooms r " +
        "WHERE r.room_type = :#{#roomType.name()} " +
        "AND r.capacity >= :minCapacity " +
        "AND r.is_active = true " +
        "AND r.id NOT IN (" +
        "  SELECT s.room_id FROM schedules s " +
        "  LEFT JOIN timeslots ts1 ON ts1.id = s.timeslot_id " +
        "  LEFT JOIN timeslots ts2 ON ts2.id = s.timeslot2_id " +
        "  JOIN timeslots chk1 ON chk1.id = :timeslotId " +
        "  JOIN timeslots chk2 ON chk2.id = :timeslot2Id " +
        "  WHERE s.room_id IS NOT NULL " +
        "  AND s.status <> 'CONFLICTED' " +
        "  AND s.semester = :semester AND s.school_year = :schoolYear " +
        "  AND (" +
        "    (ts1.day_of_week = chk1.day_of_week AND ts1.start_time < chk1.end_time AND chk1.start_time < ts1.end_time) " +
        "    OR (ts2.day_of_week = chk1.day_of_week AND ts2.start_time < chk1.end_time AND chk1.start_time < ts2.end_time) " +
        "    OR (ts1.day_of_week = chk2.day_of_week AND ts1.start_time < chk2.end_time AND chk2.start_time < ts1.end_time) " +
        "    OR (ts2.day_of_week = chk2.day_of_week AND ts2.start_time < chk2.end_time AND chk2.start_time < ts2.end_time)" +
        "  )" +
        ") " +
        "ORDER BY CASE WHEN r.campus_id = :preferredCampusId THEN 0 ELSE 1 END",
        nativeQuery = true)
List<Room> findAvailableRoomsFlexible(
        @Param("roomType") RoomType roomType,
        @Param("minCapacity") int minCapacity,
        @Param("timeslotId") Long timeslotId,
        @Param("timeslot2Id") Long timeslot2Id,
        @Param("semester") String semester,
        @Param("schoolYear") String schoolYear,
        @Param("preferredCampusId") Long preferredCampusId);

        @Query("SELECT r, COUNT(s) AS scheduledCount FROM Room r " +
        "LEFT JOIN Schedule s ON s.room = r " +
        "AND s.semester = :semester AND s.schoolYear = :schoolYear " +
        "WHERE r.campus.id = :campusId " +
        "GROUP BY r")
List<Object[]> getRoomUtilisationByCampusAndTerm(
        @Param("campusId") Long campusId,
        @Param("semester") com.timecraft.timecraft.model.CourseSubject.Semester semester,
        @Param("schoolYear") String schoolYear);
}