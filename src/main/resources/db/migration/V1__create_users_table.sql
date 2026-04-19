-- ============================================================
-- V1: Create users table
--     Two user types: STUDENT and TEACHER
--     Each type has its own profile table (1-to-1 extension)
-- ============================================================

CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    user_type       VARCHAR(20)     NOT NULL CHECK (user_type IN ('STUDENT', 'TEACHER', 'ADMIN', 'DEAN')),
    full_name       VARCHAR(150)    NOT NULL,
    school_id       VARCHAR(30)     NOT NULL UNIQUE,    -- e.g. 2021-00123
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ── Student profile ───────────────────────────────────────────────────────────
CREATE TABLE student_profiles (
    user_id         BIGINT          PRIMARY KEY,
    department_id   BIGINT          NOT NULL,   -- FK wired in V2 (departments)
    course_id       BIGINT          NOT NULL,   -- FK wired in V2 (courses)
    year_level      SMALLINT        NOT NULL CHECK (year_level BETWEEN 1 AND 5),
    section         VARCHAR(10),                -- e.g. 'A', 'B' — NULL when irregular
    is_irregular    BOOLEAN         NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_student_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    CONSTRAINT chk_irregular_no_section
        CHECK (
            (is_irregular = TRUE  AND section IS NULL) OR
            (is_irregular = FALSE AND section IS NOT NULL)
        )
);

-- ── Teacher profile ───────────────────────────────────────────────────────────
CREATE TABLE teacher_profiles (
    user_id           BIGINT          PRIMARY KEY,
    department_id     BIGINT          NOT NULL,   -- FK wired in V2; includes General Education
    campus_flexible   BOOLEAN         NOT NULL DEFAULT FALSE,
    is_ge_teacher     BOOLEAN         NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_teacher_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- ── Auto-update trigger on users.updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE  users                          IS 'All system users — students and teachers';
COMMENT ON COLUMN users.user_type                IS 'STUDENT | TEACHER | ADMIN | PROGRAM_HEAD';
COMMENT ON COLUMN users.school_id                IS 'Institutional ID e.g. 2021-00123 — unique system-wide';
COMMENT ON TABLE  student_profiles               IS '1-to-1 extension of users for student data';
COMMENT ON COLUMN student_profiles.is_irregular  IS 'TRUE = no fixed section; subjects assigned individually';
COMMENT ON COLUMN student_profiles.section       IS 'Block section e.g. A, B — NULL when irregular';
COMMENT ON TABLE  teacher_profiles               IS '1-to-1 extension of users for teacher data';