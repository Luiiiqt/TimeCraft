package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.ProgramHeadProfile;

@Repository
public interface ProgramHeadProfileRepository
        extends JpaRepository<ProgramHeadProfile, Long> {
    Optional<ProgramHeadProfile> findByUserId(Long userId);

    /** Returns all PHs for a department — supports CCSE having 2 PHs. */
    List<ProgramHeadProfile> findByDepartmentId(Long departmentId);
}