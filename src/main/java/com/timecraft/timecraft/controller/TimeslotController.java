package com.timecraft.timecraft.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.timecraft.timecraft.dto.response.ApiResponse;
import com.timecraft.timecraft.model.Timeslot;
import com.timecraft.timecraft.repository.TimeslotRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/timeslots")
@RequiredArgsConstructor
public class TimeslotController {

    private final TimeslotRepository timeslotRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN','DEAN','PROGRAM_HEAD','GE_COORDINATOR')")
    public ResponseEntity<ApiResponse<List<Timeslot>>> findAll() {
        List<Timeslot> slots = timeslotRepository
                .findAllByOrderByDayOfWeekAscSlotNumberAsc();
        return ResponseEntity.ok(ApiResponse.of(slots));
    }
}