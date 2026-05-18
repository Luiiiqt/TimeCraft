package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.timecraft.timecraft.model.Curriculum;

public interface CurriculumRepository extends JpaRepository<Curriculum, Long> {

    List<Curriculum> findByCourseId(Long courseId);

    Optional<Curriculum> findByCourseIdAndEffectiveYear(Long courseId, String effectiveYear);

    List<Curriculum> findByIsActiveTrue();

    List<Curriculum> findByCourseIdAndDeletedAtIsNotNull(Long courseId);

    @Query("SELECT c FROM Curriculum c JOIN FETCH c.course co JOIN FETCH co.department")
    List<Curriculum> findAllWithCourse();
}
