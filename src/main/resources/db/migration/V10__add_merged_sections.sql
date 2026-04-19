-- ============================================================
-- V10: Merged Sections
--
--  Supports BSIT+BSCS and ABPsy+BSPsy class merging
--  for shared major subjects.
--  The schedule entry is created once and linked here.
-- ============================================================

CREATE TABLE merged_sections (
    id                    BIGSERIAL   PRIMARY KEY,
    primary_section_id    BIGINT      NOT NULL,
    secondary_section_id  BIGINT      NOT NULL,
    subject_id            BIGINT      NOT NULL,
    semester              VARCHAR(20) NOT NULL CHECK (semester IN ('1st', '2nd', 'Summer')),
    school_year           VARCHAR(15) NOT NULL,
    created_by            BIGINT      NOT NULL,   -- dean user_id
    created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ms_primary    FOREIGN KEY (primary_section_id)   REFERENCES sections(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ms_secondary  FOREIGN KEY (secondary_section_id) REFERENCES sections(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ms_subject    FOREIGN KEY (subject_id)           REFERENCES subjects(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ms_creator    FOREIGN KEY (created_by)           REFERENCES users(id)    ON DELETE RESTRICT,
    CONSTRAINT chk_ms_diff_sections CHECK (primary_section_id <> secondary_section_id),
    CONSTRAINT uq_ms UNIQUE (primary_section_id, secondary_section_id, subject_id, semester, school_year)
);

-- Only allow merging where is_shared = TRUE on that subject
CREATE INDEX idx_ms_subject_id   ON merged_sections (subject_id);
CREATE INDEX idx_ms_primary      ON merged_sections (primary_section_id);
CREATE INDEX idx_ms_secondary    ON merged_sections (secondary_section_id);
CREATE INDEX idx_ms_term         ON merged_sections (semester, school_year);

-- Add nullable merged_section_id to schedules
ALTER TABLE schedules
    ADD COLUMN merged_section_id BIGINT,
    ADD CONSTRAINT fk_schedules_merged
        FOREIGN KEY (merged_section_id) REFERENCES merged_sections(id) ON DELETE SET NULL;

CREATE INDEX idx_schedules_merged ON schedules (merged_section_id)
    WHERE merged_section_id IS NOT NULL;

COMMENT ON TABLE merged_sections IS 'Tracks merged class sessions — e.g. BSIT+BSCS or ABPsy+BSPsy sharing a subject slot';
COMMENT ON COLUMN merged_sections.primary_section_id IS 'The section the schedule entry is formally assigned to';
COMMENT ON COLUMN merged_sections.secondary_section_id IS 'The section being merged in — attends the same slot';