package com.timecraft.timecraft.security;

import java.util.List;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Called by Spring Security on every authenticated request.
     * Loads the user by email (used as the login identifier in TimeCraft).
     *
     * Roles are mapped from UserType enum:
     * STUDENT → ROLE_STUDENT
     * TEACHER → ROLE_TEACHER
     *
     * Inactive users are loaded but marked as disabled so Spring Security
     * rejects their tokens automatically via isEnabled() = false.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("UserDetailsService: no user found for email={}",
                            email);
                    return new UsernameNotFoundException(
                            "User not found with email: " + email);
                });

        return buildUserDetails(user);
    }

    // ── Builder ───────────────────────────────────────────────────────────────

    private UserDetails buildUserDetails(User user) {
        List<SimpleGrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority(
                        "ROLE_" + user.getUserType().name()));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(!user.isActive()) // inactive users are rejected
                .build();
    }
}