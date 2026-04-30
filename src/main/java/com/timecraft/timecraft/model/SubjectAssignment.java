package com.timecraft.timecraft.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "subject_assignments", uniqueConstraints = @UniqueConstraint(name = "uq_sa", columnNames = { "subject_id",
                "semester", "school_year" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "assignedBy", "hibernateLazyInitializer", "handler" })
public class SubjectAssignment {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "subject_id", nullable = false)
        private Subject subject;

        @ManyToOne(fetch = FetchType.LAZY, optional = true)
        @JoinColumn(name = "section_id", nullable = true)
        @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "schedules",
                        "students" })
        private Section section;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "teacher_id", nullable = false)
        @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler",
                        "teacherProfile", "schedules", "assignments" })
        private User teacher;

        @ManyToOne(fetch = FetchType.LAZY, optional = false)
        @JoinColumn(name = "assigned_by", nullable = false)
        private User assignedBy;

        @Column(name = "semester", nullable = false, length = 10)
        private String semester;

        @Column(name = "school_year", nullable = false, length = 10)
        private String schoolYear;

        @Column(name = "is_finalized", nullable = false)
        @Builder.Default
        private boolean isFinalized = false;

        @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
        @Builder.Default
        private LocalDateTime createdAt = LocalDateTime.now();

        @Column(name = "updated_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT NOW()")
        @Builder.Default
        private LocalDateTime updatedAt = LocalDateTime.now();

}