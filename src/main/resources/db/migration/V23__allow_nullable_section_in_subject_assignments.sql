-- V21__allow_nullable_section_in_subject_assignments.sql
ALTER TABLE subject_assignments ALTER COLUMN section_id DROP NOT NULL;
ALTER TABLE subject_assignments DROP CONSTRAINT IF EXISTS uq_sa;
ALTER TABLE subject_assignments ADD CONSTRAINT uq_sa UNIQUE (subject_id, semester, school_year);