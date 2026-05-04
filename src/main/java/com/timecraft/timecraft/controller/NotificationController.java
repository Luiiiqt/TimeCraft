package com.timecraft.timecraft.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class NotificationController {

    private final SimpMessagingTemplate messagingTemplate;

    // Broadcast to all subscribers of /topic/notifications
    public void sendNotification(String type, String message) {
        messagingTemplate.convertAndSend("/topic/notifications",
            new NotificationPayload(type, message));
    }

    public record NotificationPayload(String type, String message) {}
}