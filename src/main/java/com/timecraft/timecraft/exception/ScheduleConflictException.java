package com.timecraft.timecraft.exception;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class ScheduleConflictException extends RuntimeException {

    private final List<String> conflicts;

    public ScheduleConflictException(String message) {
        super(message);
        this.conflicts = List.of(message);
    }

    public ScheduleConflictException(String message, List<String> conflicts) {
        super(message);
        this.conflicts = conflicts;
    }

    /** Returns all conflict descriptions — used by GlobalExceptionHandler. */
    public List<String> getConflicts() {
        return conflicts;
    }
}