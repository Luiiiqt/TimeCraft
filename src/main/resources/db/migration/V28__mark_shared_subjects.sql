-- ============================================================
-- V28: Mark subjects shared between BSIT and BSCS as is_shared=true
-- This prevents the scheduling engine from scheduling them twice.
-- ============================================================

UPDATE course_subjects
SET is_shared = true
WHERE subject_id IN (
    SELECT subject_id
    FROM course_subjects
    GROUP BY subject_id
    HAVING COUNT(DISTINCT course_id) > 1
);