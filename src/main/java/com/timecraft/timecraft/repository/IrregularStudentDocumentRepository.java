package com.timecraft.timecraft.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.timecraft.timecraft.model.IrregularStudentDocument;

public interface IrregularStudentDocumentRepository
        extends JpaRepository<IrregularStudentDocument, Long> {

    List<IrregularStudentDocument> findByStudentId(Long studentId);
}