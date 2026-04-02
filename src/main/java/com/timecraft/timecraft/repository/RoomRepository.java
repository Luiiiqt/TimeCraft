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
        @Query("SELECT r FROM Room r " +
                        "WHERE r.campus.id = :campusId " +
                        "AND r.roomType = :roomType " +
                        "AND r.capacity >= :minCapacity " +
                        "AND r.isActive = true " +
                        "AND r.id NOT IN (" +
                        "  SELECT s.room.id FROM Schedule s " +
                        "  WHERE (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
                        "  AND s.semester = :semester " +
                        "  AND s.schoolYear = :schoolYear)")
        List<Room> findAvailableRooms(
                        @Param("campusId") Long campusId,
                        @Param("roomType") RoomType roomType,
                        @Param("minCapacity") int minCapacity,
                        @Param("timeslotId") Long timeslotId,
                        @Param("semester") com.timecraft.timecraft.model.CourseSubject.Semester semester,
                        @Param("schoolYear") String schoolYear);

        // ── Scheduling engine: campus-flexible room lookup (GE teachers) ──────────

        /**
         * Returns available rooms across BOTH campuses for GE (campus-flexible)
         * teachers.
         * Results are ordered so preferred campus rooms appear first,
         * minimizing unnecessary cross-campus travel.
         * Use only when teacher.campusFlexible = true.
         */
        @Query("SELECT r FROM Room r " +
                        "WHERE r.roomType = :roomType " +
                        "AND r.capacity >= :minCapacity " +
                        "AND r.isActive = true " +
                        "AND r.id NOT IN (" +
                        "  SELECT s.room.id FROM Schedule s " +
                        "  WHERE (s.timeslot.id = :timeslotId OR s.timeslot2.id = :timeslotId) " +
                        "  AND s.semester = :semester " +
                        "  AND s.schoolYear = :schoolYear) " +
                        "ORDER BY CASE WHEN r.campus.id = :preferredCampusId THEN 0 ELSE 1 END")
        List<Room> findAvailableRoomsFlexible(
                        @Param("roomType") RoomType roomType,
                        @Param("minCapacity") int minCapacity,
                        @Param("timeslotId") Long timeslotId,
                        @Param("semester") com.timecraft.timecraft.model.CourseSubject.Semester semester,
                        @Param("schoolYear") String schoolYear,
                        @Param("preferredCampusId") Long preferredCampusId);

        // ── Room utilisation report ───────────────────────────────────────────────

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