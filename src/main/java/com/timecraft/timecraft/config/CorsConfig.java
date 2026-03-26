package com.timecraft.timecraft.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    /**
     * Frontend origin — set in application.yml or via environment variable.
     * Defaults to localhost:5173 (Vite dev server) for local development.
     * In production, set CORS_ALLOWED_ORIGIN=https://your-domain.com
     */
    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String allowedOrigin;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Only allow requests from the React frontend origin
        config.setAllowedOrigins(List.of(allowedOrigin));

        // HTTP methods allowed from the frontend
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        // Headers the frontend is allowed to send
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With"
        ));

        // Headers the frontend is allowed to read from responses
        config.setExposedHeaders(List.of(
                "Authorization"
        ));

        // Allow cookies / Authorization header credentials
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour (reduces OPTIONS requests)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        // Apply this CORS config to all API endpoints
        source.registerCorsConfiguration("/api/**", config);

        return source;
    }
}