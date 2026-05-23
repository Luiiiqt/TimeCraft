-- Allow regular students to have no section (section assigned later by admin)
ALTER TABLE student_profiles
    DROP CONSTRAINT chk_irregular_no_section;

ALTER TABLE student_profiles
    ADD CONSTRAINT chk_irregular_no_section
        CHECK (
            (is_irregular = TRUE AND section IS NULL) OR
            (is_irregular = FALSE)
        );