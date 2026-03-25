-- ============================================================
-- V9: Campus flexibility for teachers
--
--  campus_flexible    : TRUE  = GE teachers who can teach at
--                               either CLI or CHS
--                       FALSE = dept teachers locked to their
--                               college's campus (default)
--
--  preferred_campus_id: Optional home campus for flexible teachers.
--                       Scheduler prefers this campus first but
--                       assigns to the other when needed.
-- ============================================================

ALTER TABLE teacher_profiles
    ADD COLUMN campus_flexible      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN preferred_campus_id  BIGINT,
    ADD CONSTRAINT fk_tp_preferred_campus
        FOREIGN KEY (preferred_campus_id)
        REFERENCES campuses (id) ON DELETE SET NULL;

COMMENT ON COLUMN teacher_profiles.campus_flexible
    IS 'TRUE = GE teacher; schedulable at CLI or CHS. FALSE = locked to dept campus.';

COMMENT ON COLUMN teacher_profiles.preferred_campus_id
    IS 'Home campus for flexible GE teachers. Scheduler prefers this campus first.';

-- ── Mark all GE dept teachers as campus-flexible ──────────────────────────────
UPDATE teacher_profiles
SET campus_flexible = TRUE
WHERE department_id = (SELECT id FROM departments WHERE code = 'GEN_ED');

-- ── Set preferred campus for GE teachers to CLI (default home) ────────────────
UPDATE teacher_profiles
SET preferred_campus_id = (SELECT id FROM campuses WHERE code = 'CLI')
WHERE campus_flexible = TRUE;

-- ── Index for fast lookup of flexible teachers ────────────────────────────────
CREATE INDEX idx_tp_campus_flexible ON teacher_profiles (campus_flexible)
    WHERE campus_flexible = TRUE;