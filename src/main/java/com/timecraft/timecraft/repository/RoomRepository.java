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

    // ── Filter ────────────────────────────────────────────────────────────────

    List<Room> findByCampusId(Long campusId);

    List<Room> findByRoomType(RoomType roomType);

    List<Room> findByCampusIdAndRoomType(Long campusId, RoomType roomType);

    List<Room> findByCampusIdAndIsActiveTrue(Long campusId);

    List<Room> findByCampusIdAndRoomTypeAndIsActiveTrue(Long campusId,
                                                         RoomType roomType);

    List<Room> findByCapacityGreaterThanEqualAndIsActiveTrue(int minCapacity);

    List<Room> findByCampusIdAndRoomTypeAndCapacityGreaterThanEqualAndIsActiveTrue(
            Long campusId, RoomType roomType, int minCapacity);

    // ── Scheduling engine: available rooms ────────────────────────────────────

    /**
     * Returns rooms on a campus with the required type and capacity
     * that are NOT already booked for either the first or second
     * timeslot in the given semester/school year.
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
           "  AND s.schoolYear = :schoolYear" +
           ")")
    List<Room> findAvailableRooms(@Param("campusId") Long campusId,
                                   @Param("roomType") RoomType roomType,
                                   @Param("minCapacity") int minCapacity,
                                   @Param("timeslotId") Long timeslotId,
                                   @Param("semester") String semester,
                                   @Param("schoolYear") String schoolYear);

    // ── Room utilisation report ───────────────────────────────────────────────

    @Query("SELECT r, COUNT(s) AS scheduledCount FROM Room r " +
           "LEFT JOIN Schedule s ON s.room = r " +
           "AND s.semester = :semester AND s.schoolYear = :schoolYear " +
           "WHERE r.campus.id = :campusId " +
           "GROUP BY r")
    List<Object[]> getRoomUtilisationByCampusAndTerm(@Param("campusId") Long campusId,
                                                      @Param("semester") String semester,
                                                      @Param("schoolYear") String schoolYear);
}