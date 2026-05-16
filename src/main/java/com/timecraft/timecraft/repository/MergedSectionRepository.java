package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.MergedSection;

@Repository
public interface MergedSectionRepository extends JpaRepository<MergedSection, Long> {

    List<MergedSection> findBySemesterAndSchoolYear(String semester, String schoolYear);
    Optional<MergedSection> findByPrimarySectionIdAndSecondarySectionIdAndSubjectIdAndSemesterAndSchoolYear(
            Long primarySectionId,
            Long secondarySectionId,
            Long subjectId,
            String semester,
            String schoolYear);

    List<MergedSection> findByPrimarySectionId(Long primarySectionId);

    List<MergedSection> findBySecondarySectionId(Long secondarySectionId);

    boolean existsByPrimarySectionIdAndSecondarySectionIdAndSubjectIdAndSemesterAndSchoolYear(
            Long primarySectionId,
            Long secondarySectionId,
            Long subjectId,
            String semester,
            String schoolYear);

    void deleteByPrimarySectionIdAndSemesterAndSchoolYear(
            Long primarySectionId, String semester, String schoolYear);
}