package com.timecraft.timecraft.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.Campus;
import com.timecraft.timecraft.model.Room;
import com.timecraft.timecraft.model.Room.RoomType;
import com.timecraft.timecraft.repository.CampusRepository;
import com.timecraft.timecraft.repository.RoomRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;
    private final CampusRepository campusRepository;

    // ── Lookup ────────────────────────────────────────────────────────────────

    public Room findById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Room not found with id: " + id));
    }

    public Campus findCampusById(Long id) {
        return campusRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Campus not found with id: " + id));
    }

    public Campus findCampusByCode(String code) {
        return campusRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Campus not found with code: " + code));
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<Room> findAll() {
        return roomRepository.findAll();
    }

    public List<Campus> findAllCampuses() {
        return campusRepository.findByIsActiveTrue();
    }

    public List<Room> findByCampus(Long campusId) {
        return roomRepository.findByCampusIdAndIsActiveTrue(campusId);
    }

    public List<Room> findByCampusAndType(Long campusId, RoomType type) {
        return roomRepository.findByCampusIdAndRoomTypeAndIsActiveTrue(
                campusId, type);
    }

    // ── Scheduling engine helpers ─────────────────────────────────────────────

    /**
     * Used by the scheduling engine for dept (campus-locked) teachers.
     */
    public List<Room> findAvailableRooms(Long campusId, RoomType roomType,
            int minCapacity, Long timeslotId,
            com.timecraft.timecraft.model.CourseSubject.Semester semester,
            String schoolYear) {
        return roomRepository.findAvailableRooms(
                campusId, roomType, minCapacity,
                timeslotId, semester, schoolYear);
    }

    /**
     * Used by the scheduling engine for GE (campus-flexible) teachers.
     * Searches both campuses, preferred campus rooms appear first.
     */
    public List<Room> findAvailableRoomsFlexible(RoomType roomType,
            int minCapacity,
            Long timeslotId,
            com.timecraft.timecraft.model.CourseSubject.Semester semester,
            String schoolYear,
            Long preferredCampusId) {
        return roomRepository.findAvailableRoomsFlexible(
                roomType, minCapacity, timeslotId,
                semester, schoolYear, preferredCampusId);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public Room create(Long campusId, String name, String roomNumber,
            int capacity, RoomType roomType) {
        Campus campus = findCampusById(campusId);
        return roomRepository.save(Room.builder()
                .campus(campus)
                .name(name)
                .roomNumber(roomNumber)
                .capacity(capacity)
                .roomType(roomType)
                .build());
    }

    // ── Deactivate ────────────────────────────────────────────────────────────

    @Transactional
    public void deactivate(Long id) {
        Room room = findById(id);
        room.setActive(false);
        roomRepository.save(room);
    }
}