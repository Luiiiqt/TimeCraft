-- ============================================================
-- V17: Curriculum
--
--  One curriculum = one full 4-year program structure per course.
--  Imported by the Dean from Excel/CSV.
--  course_subjects already stores the subject-per-year-semester
--  mapping; this table tracks the import event and metadata.
-- ============================================================

CREATE TABLE curricula (
    id              BIGSERIAL       PRIMARY KEY,
    course_id       BIGINT          NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    name            VARCHAR(150)    NOT NULL,           -- e.g. "BSIT Curriculum 2024"
    effective_year  VARCHAR(10)     NOT NULL,           -- e.g. "2024-2025"
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    imported_by     BIGINT          REFERENCES users(id) ON DELETE SET NULL,
    imported_at     TIMESTAMP       NOT NULL DEFAULT NOW(),
    notes           TEXT,
    CONSTRAINT uq_curriculum_course_year UNIQUE (course_id, effective_year)
);

-- Link course_subjects rows to a specific curriculum
ALTER TABLE course_subjects
    ADD COLUMN IF NOT EXISTS curriculum_id BIGINT
        REFERENCES curricula(id) ON DELETE SET NULL;

CREATE INDEX idx_curricula_course_id  ON curricula (course_id);
CREATE INDEX idx_curricula_active     ON curricula (is_active);
CREATE INDEX idx_cs_curriculum_id     ON course_subjects (curriculum_id);

COMMENT ON TABLE curricula IS 'Dean-imported curriculum per course — one per 4-year program structure';
COMMENT ON COLUMN curricula.effective_year IS 'School year this curriculum takes effect e.g. 2024-2025';