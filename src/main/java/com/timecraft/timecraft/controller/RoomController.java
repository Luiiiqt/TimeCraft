package com.timecraft.timecraft.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.Campus;
import com.timecraft.timecraft.model.Room;
import com.timecraft.timecraft.model.Room.RoomType;
import com.timecraft.timecraft.service.RoomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    // ── GET /api/v1/rooms/campuses ────────────────────────────────────────────

    @GetMapping("/campuses")
    public ResponseEntity<ApiResponse<List<Campus>>> findCampuses() {
        return ResponseEntity.ok(
                ApiResponse.of(roomService.findAllCampuses()));
    }

    // ── GET /api/v1/rooms ─────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<Room>>> findAll(
            @RequestParam(required = false) Long campusId,
            @RequestParam(required = false) String roomType) {

        List<Room> rooms;

        if (campusId != null && roomType != null) {
            rooms = roomService.findByCampusAndType(
                    campusId, RoomType.valueOf(roomType));
        } else if (campusId != null) {
            rooms = roomService.findByCampus(campusId);
        } else {
            rooms = roomService.findAll();
        }

        return ResponseEntity.ok(ApiResponse.of(rooms));
    }

    // ── GET /api/v1/rooms/{id} ────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Room>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.of(roomService.findById(id)));
    }

    // ── POST /api/v1/rooms ────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Room>> create(
            @RequestBody Map<String, Object> body) {
        Room room = roomService.create(
                Long.valueOf(body.get("campusId").toString()),
                (String) body.get("name"),
                (String) body.get("roomNumber"),
                Integer.parseInt(body.get("capacity").toString()),
                RoomType.valueOf((String) body.get("roomType")));
        return ResponseEntity.ok(ApiResponse.success("Room created", room));
    }

    // ── PUT /api/v1/rooms/{id}/deactivate ─────────────────────────────────────

    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        roomService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Room deactivated"));
    }
}