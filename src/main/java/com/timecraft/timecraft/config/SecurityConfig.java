package com.timecraft.timecraft.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.timecraft.timecraft.security.JwtAuthFilter;
import com.timecraft.timecraft.security.UserDetailsServiceImpl;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // enables @PreAuthorize on controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final CorsConfig corsConfig;

    // ── Security filter chain ─────────────────────────────────────────────────

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {
        http
                // Disable CSRF — we use stateless JWT, not cookies
                .csrf(AbstractHttpConfigurer::disable)

                // Apply CORS config from CorsConfig bean
                .cors(cors -> cors.configurationSource(
                        corsConfig.corsConfigurationSource()))

                // Stateless session — no HttpSession created or used
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Route-level authorization rules
                .authorizeHttpRequests(auth -> auth

                        // ── Public endpoints ──────────────────────────────────────────
                        .requestMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/register")
                        .permitAll()

                        // Swagger / OpenAPI docs — accessible without auth
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/api-docs")
                        .permitAll()

                        // Actuator health check — public
                        .requestMatchers("/actuator/health").permitAll()

                        // ── Student endpoints ─────────────────────────────────────────
                        // Students can only view their own schedule
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/schedules/my",
                                "/api/v1/students/me")
                        .hasRole("STUDENT")

                        // ── Teacher endpoints ─────────────────────────────────────────
                        // Teachers can view their schedule and update availability
                        .requestMatchers(HttpMethod.GET,
                                "/api/v1/schedules/teacher/**",
                                "/api/v1/teachers/me")
                        .hasAnyRole("TEACHER", "ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/teachers/*/availability")
                        .hasAnyRole("TEACHER", "ADMIN")

                        // ── Admin-only endpoints ──────────────────────────────────────
                        .requestMatchers(
                                "/api/v1/schedules/generate",
                                "/api/v1/schedules/publish/**",
                                "/api/v1/schedules/audit",
                                "/api/v1/conflicts/**",
                                "/api/v1/rooms/**",
                                "/api/v1/departments/**",
                                "/api/v1/sections/**",
                                "/api/v1/reports/**")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/teachers",
                                "/api/v1/students")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/schedules/**")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/schedules/**",
                                "/api/v1/teachers/**",
                                "/api/v1/students/**")
                        .hasRole("ADMIN")

                        // All other requests require authentication
                        .anyRequest().authenticated())

                // Register authentication provider
                .authenticationProvider(authenticationProvider())

                // Insert JWT filter before Spring's username/password filter
                .addFilterBefore(jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ── Beans ─────────────────────────────────────────────────────────────────

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}