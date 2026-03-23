package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.Campus;

@Repository
public interface CampusRepository extends JpaRepository<Campus, Long> {

    Optional<Campus> findByCode(String code);

    Optional<Campus> findByName(String name);

    boolean existsByCode(String code);

    List<Campus> findByIsActiveTrue();
}