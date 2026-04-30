-- V19

ALTER TABLE teacher_profiles
    ADD COLUMN IF NOT EXISTS is_cross_department BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN teacher_profiles.is_cross_department
    IS 'TRUE = teacher can be assigned subjects outside their home department';
