package com.timecraft.timecraft.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.timecraft.timecraft.model.User;
import com.timecraft.timecraft.model.User.UserType;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

       Optional<User> findByEmail(String email);

       Optional<User> findBySchoolId(String schoolId);

       boolean existsByEmail(String email);

       boolean existsBySchoolId(String schoolId);

       List<User> findByUserType(UserType userType);

       List<User> findByUserTypeAndIsActiveTrue(UserType userType);

       @Query("SELECT u FROM User u WHERE u.userType = :type " +
                     "AND LOWER(u.fullName) LIKE LOWER(CONCAT('%', :name, '%'))")
       List<User> searchByTypeAndName(@Param("type") UserType type,
                     @Param("name") String name);
}