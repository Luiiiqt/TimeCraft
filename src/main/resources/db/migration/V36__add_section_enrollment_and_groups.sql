-- V36__add_section_enrollment_and_groups.sql
-- Add enrolled_count and group_number to sections table

ALTER TABLE sections
    ADD COLUMN IF NOT EXISTS enrolled_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS group_number   SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN sections.enrolled_count IS 'Total enrolled students for this section/semester';
COMMENT ON COLUMN sections.group_number   IS '0 = no split; 1 = Group 1; 2 = Group 2 (when enrolled > 40)';