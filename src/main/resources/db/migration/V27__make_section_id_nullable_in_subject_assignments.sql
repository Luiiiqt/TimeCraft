-- PH assigns teacher to subject only; Dean assigns sections later
ALTER TABLE subject_assignments DROP CONSTRAINT IF EXISTS uq_sa;

ALTER TABLE subject_assignments ALTER COLUMN section_id DROP NOT NULL;

ALTER TABLE subject_assignments ADD CONSTRAINT uq_sa_subject_term
    UNIQUE (subject_id, semester, school_year);