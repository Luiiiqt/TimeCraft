package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.DeanProfile;

@Repository
public interface DeanProfileRepository
        extends JpaRepository<DeanProfile, Long> {
    Optional<DeanProfile> findByUserId(Long userId);

    /** Returns all Deans for a department — supports CCSE having 2 Deans. */
    List<DeanProfile> findByDepartmentId(Long departmentId);
}