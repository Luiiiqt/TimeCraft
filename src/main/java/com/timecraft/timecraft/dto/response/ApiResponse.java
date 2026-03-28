package com.timecraft.timecraft.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Generic wrapper for all API responses.
 *
 * Usage:
 *   ApiResponse.success("Teacher created")
 *   ApiResponse.success("Schedule found", scheduleData)
 *   ApiResponse.error("Room not found")
 *
 * The 'data' field is omitted from JSON when null
 * to keep responses clean for simple success/error messages.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String  message;
    private T       data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    // ── Static factory methods ────────────────────────────────────────────────

    /** Success with message only — for create/update/delete confirmations. */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    /** Success with message and payload — for GET responses. */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /** Success with payload only — for lists and single-resource fetches. */
    public static <T> ApiResponse<T> of(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    /** Error with message only. */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}