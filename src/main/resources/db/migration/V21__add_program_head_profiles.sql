-- V21__add_program_head_profiles.sql
CREATE TABLE IF NOT EXISTS program_head_profiles (
    user_id     BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department_id BIGINT NOT NULL REFERENCES departments(id)
);