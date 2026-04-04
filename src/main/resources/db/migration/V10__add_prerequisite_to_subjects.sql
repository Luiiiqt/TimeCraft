ALTER TABLE subjects
    ADD COLUMN IF NOT EXISTS prerequisite_subject_id BIGINT NULL,
    ADD CONSTRAINT fk_subject_prerequisite
        FOREIGN KEY (prerequisite_subject_id)
        REFERENCES subjects (id) ON DELETE SET NULL;