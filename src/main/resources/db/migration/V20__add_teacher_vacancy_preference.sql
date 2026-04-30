ALTER TABLE teacher_subject_preferences
    ADD COLUMN IF NOT EXISTS vacant_day  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS vacant_time VARCHAR(10);