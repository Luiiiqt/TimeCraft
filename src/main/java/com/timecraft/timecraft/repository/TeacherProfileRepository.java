package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.TeacherProfile;

@Repository
public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Long> {

    Optional<TeacherProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<TeacherProfile> findByCampusFlexibleTrue();

    List<TeacherProfile> findByDepartmentId(Long departmentId);

    @Query("SELECT tp FROM TeacherProfile tp " +
           "WHERE tp.campusFlexible = true " +
           "AND tp.preferredCampus.id = :campusId")
    List<TeacherProfile> findFlexibleByPreferredCampus(
            @Param("campusId") Long campusId);

    /** Teachers allowed to teach outside their home department. */
    List<TeacherProfile> findByIsCrossDepartmentTrue();

    /** All GE teachers: campus-flexible OR in GEN_ED department. */
    @Query("SELECT tp FROM TeacherProfile tp WHERE tp.campusFlexible = true OR tp.department.code = 'GEN_ED'")
    List<TeacherProfile> findAllGETeachers();
}