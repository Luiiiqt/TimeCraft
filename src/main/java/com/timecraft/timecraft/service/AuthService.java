package com.timecraft.timecraft.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.exception.ResourceNotFoundException;
import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.model.User.UserType;
import com.timecraft.timecraft.repository.ProgramHeadProfileRepository;
import com.timecraft.timecraft.repository.StudentProfileRepository;
import com.timecraft.timecraft.repository.TeacherProfileRepository;
import com.timecraft.timecraft.repository.UserRepository;
import com.timecraft.timecraft.security.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository    studentProfileRepository;
    private final TeacherProfileRepository    teacherProfileRepository;
    private final ProgramHeadProfileRepository programHeadProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    // ── Spring Security UserDetailsService ────────────────────────────────────

    /**
     * Called by Spring Security's filter chain on every authenticated request.
     * Loads user by email — email is the login identifier in TimeCraft.

    // ── Login ─────────────────────────────────────────────────────────────────

    /**
     * Authenticates a user by email + password and returns a signed JWT.
     * The JWT payload includes: email, role, userId, schoolId, fullName,
     * and profile-specific fields (department, course, section, irregular flag).
     *
     * @throws BadCredentialsException if email not found or password incorrect
     */
    @Transactional
    public Map<String, Object> login(String email, String rawPassword) {
        // Let Spring Security validate credentials (throws on failure)
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, rawPassword));
            log.info("Successful login for: {}", email);
        } catch (Exception ex) {
            log.warn("Failed login attempt for: {}", email);
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + email));

        if (!user.isActive()) {
            throw new BadCredentialsException(
                    "Account is deactivated. Please contact the registrar.");
        }

        // Build JWT claims
        Map<String, Object> claims = buildClaims(user);

        String token = jwtUtil.generateToken(email, claims);

        // Build response body
        Map<String, Object> response = new HashMap<>(claims);
        response.put("token", token);
        response.put("tokenType", "Bearer");
        return response;
    }

    // ── Token validation ──────────────────────────────────────────────────────

    /**
     * Validates a JWT and returns the email (subject) it was issued for.
     * Used by the JWT filter on each request.
     */
    public String extractEmail(String token) {
        return jwtUtil.extractUsername(token);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        return jwtUtil.validateToken(token, userDetails);
    }

    // ── Current user info ─────────────────────────────────────────────────────

    /**
     * Returns a profile summary for the currently authenticated user.
     * Used by the /me endpoint.
     */
    public Map<String, Object> getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found: " + email));
        return buildClaims(user);
    }

    // ── Claims builder ────────────────────────────────────────────────────────

    /**
     * Builds the JWT payload with common fields plus role-specific fields.
     * This is also used as the /me response body.
     */
    private Map<String, Object> buildClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("schoolId", user.getSchoolId());
        claims.put("fullName", user.getFullName());
        claims.put("role", user.getUserType().name());

        if (user.getUserType() == UserType.STUDENT) {
            enrichWithStudentClaims(user, claims);
        } else if (user.getUserType() == UserType.TEACHER) {
            enrichWithTeacherClaims(user, claims);
        } else if (user.getUserType() == UserType.PROGRAM_HEAD) {
            enrichWithProgramHeadClaims(user, claims);
        }
        // ADMIN has no profile table — base claims only

        return claims;
    }

    private void enrichWithStudentClaims(User user, Map<String, Object> claims) {
        studentProfileRepository.findByUserId(user.getId()).ifPresent(sp -> {
            claims.put("departmentId", sp.getDepartment().getId());
            claims.put("departmentName", sp.getDepartment().getName());
            claims.put("courseId", sp.getCourse().getId());
            claims.put("courseCode", sp.getCourse().getCode());
            claims.put("courseName", sp.getCourse().getName());
            claims.put("yearLevel", sp.getYearLevel());
            claims.put("section", sp.getSection());
            claims.put("isIrregular", sp.isIrregular());
        });
    }

    private void enrichWithTeacherClaims(User user, Map<String, Object> claims) {
        teacherProfileRepository.findByUserId(user.getId()).ifPresent(tp -> {
            claims.put("departmentId", tp.getDepartment().getId());
            claims.put("departmentName", tp.getDepartment().getName());
            claims.put("campusFlexible", tp.isCampusFlexible());
            if (tp.getPreferredCampus() != null) {
                claims.put("preferredCampusId", tp.getPreferredCampus().getId());
                claims.put("preferredCampusCode", tp.getPreferredCampus().getCode());
            }
        });
    }

    private void enrichWithProgramHeadClaims(User user, Map<String, Object> claims) {
        programHeadProfileRepository.findByUserId(user.getId()).ifPresent(ph -> {
            claims.put("departmentId",   ph.getDepartment().getId());
            claims.put("departmentName", ph.getDepartment().getName());
            claims.put("departmentCode", ph.getDepartment().getCode());
        });
    }
}