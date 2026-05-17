package com.timecraft.timecraft.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.timecraft.timecraft.model.Schedule;
import com.timecraft.timecraft.model.Schedule.ScheduleStatus;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.api.model}")
    private String model;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public String analyzeSchedule(List<Schedule> allSchedules) {
        try {
            // Only send conflicted schedules to stay within token limits
            List<Schedule> conflicted = allSchedules.stream()
                    .filter(s -> s.getStatus() == ScheduleStatus.CONFLICTED)
                    .toList();

            long total = allSchedules.size();
            long conflictCount = conflicted.size();
            long successful = total - conflictCount;

            String prompt = buildPrompt(total, successful, conflictCount, conflicted);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);

            Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                    Map.of("role", "system", "content",
                        "You are a scheduling assistant for a college timetabling system. " +
                        "Analyze the schedule generation results and provide a brief, " +
                        "actionable summary in 3-5 sentences. Be specific and concise."),
                    Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 300,
                "temperature", 0.3
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(apiUrl, entity, String.class);

            JsonNode root = objectMapper.readTree(response);
            return root.path("choices").get(0).path("message").path("content").asText();

        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage());
            return "AI analysis unavailable.";
        }
    }

    private String buildPrompt(long total, long successful,
            long conflictCount, List<Schedule> conflicted) {

        StringBuilder sb = new StringBuilder();
        sb.append(String.format(
            "Schedule generation results: %d total entries, %d successful, %d conflicted.\n\n",
            total, successful, conflictCount));

        if (!conflicted.isEmpty()) {
            sb.append("Conflicted subjects that could not be scheduled:\n");
            conflicted.stream().limit(10).forEach(s -> {
                String subject = s.getSubject() != null ? s.getSubject().getCode() : "Unknown";
                String section = s.getSection() != null ? s.getSection().getDisplayLabel() : "Unknown";
                sb.append(String.format("- Subject: %s | Section: %s\n", subject, section));
            });
            sb.append("\nProvide: (1) what likely caused these conflicts, " +
                      "(2) what the admin should check or fix, " +
                      "(3) overall schedule health assessment.");
        } else {
            sb.append("All subjects were successfully scheduled with no conflicts. " +
                      "Provide a brief confirmation and any general recommendations.");
        }

        return sb.toString();
    }
}