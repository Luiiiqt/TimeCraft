-- ── 1. Extend user_type to include PROGRAM_HEAD ───────────────────────────────
ALTER TABLE users DROP CONSTRAINT users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('STUDENT', 'TEACHER', 'ADMIN', 'PROGRAM_HEAD'));

-- ── 2. Program head profiles ──────────────────────────────────────────────────
CREATE TABLE program_head_profiles (
    user_id         BIGINT      PRIMARY KEY,
    department_id   BIGINT      NOT NULL,
    CONSTRAINT fk_ph_user       FOREIGN KEY (user_id)       REFERENCES users(id)        ON DELETE CASCADE,
    CONSTRAINT fk_ph_department FOREIGN KEY (department_id) REFERENCES departments(id)  ON DELETE RESTRICT,
    CONSTRAINT uq_ph_department UNIQUE (department_id)  -- one program head per department
);

-- Maps which courses each Program Head manages
-- Supports CCSE having 2 Program Heads split across courses
CREATE TABLE program_head_courses (
    ph_user_id  BIGINT NOT NULL,
    course_id   BIGINT NOT NULL,
    PRIMARY KEY (ph_user_id, course_id),
    CONSTRAINT fk_phc_user   FOREIGN KEY (ph_user_id) REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_phc_course FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
);

-- ── 3. Teacher subject preferences (teacher requests subjects) ────────────────
CREATE TABLE teacher_subject_preferences (
    id              BIGSERIAL   PRIMARY KEY,
    teacher_id      BIGINT      NOT NULL,
    subject_id      BIGINT      NOT NULL,
    course_id       BIGINT,     -- NULL = willing to teach for any course
    semester        VARCHAR(20) NOT NULL,
    school_year     VARCHAR(15) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
    requested_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMP,
    reviewed_by     BIGINT,     -- program_head user_id
    CONSTRAINT fk_tsp_teacher   FOREIGN KEY (teacher_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_tsp_subject   FOREIGN KEY (subject_id)    REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tsp_reviewer  FOREIGN KEY (reviewed_by)   REFERENCES users(id)    ON DELETE SET NULL,
    CONSTRAINT uq_tsp           UNIQUE (teacher_id, subject_id, semester, school_year),
    CONSTRAINT chk_tsp_status   CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_tsp_semester CHECK (semester IN ('1st', '2nd', 'Summer', 'FIRST', 'SECOND', 'FIRST_SEMESTER', 'SECOND_SEMESTER'))
    CONSTRAINT fk_tsp_course    FOREIGN KEY (course_id)     REFERENCES courses(id)  ON DELETE SET NULL,
);

-- ── 4. Subject assignments (program head finalizes teacher → subject) ─────────
CREATE TABLE subject_assignments (
    id              BIGSERIAL   PRIMARY KEY,
    subject_id      BIGINT      NOT NULL,
    section_id      BIGINT      NOT NULL,
    teacher_id      BIGINT      NOT NULL,
    assigned_by     BIGINT      NOT NULL,   -- program_head user_id
    semester        VARCHAR(20) NOT NULL,
    school_year     VARCHAR(15) NOT NULL,
    is_finalized    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sa_subject    FOREIGN KEY (subject_id)    REFERENCES subjects(id)  ON DELETE CASCADE,
    CONSTRAINT fk_sa_section    FOREIGN KEY (section_id)    REFERENCES sections(id)  ON DELETE RESTRICT,
    CONSTRAINT fk_sa_teacher    FOREIGN KEY (teacher_id)    REFERENCES users(id)     ON DELETE RESTRICT,
    CONSTRAINT fk_sa_assigned   FOREIGN KEY (assigned_by)   REFERENCES users(id)     ON DELETE RESTRICT,
    CONSTRAINT uq_sa            UNIQUE (subject_id, section_id, semester, school_year)
);

CREATE TRIGGER trg_subject_assignments_updated_at
    BEFORE UPDATE ON subject_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 5. Seed one program head per department ───────────────────────────────────
-- Password = "programhead123" (bcrypt)
INSERT INTO users (user_type, full_name, school_id, email, password_hash)
VALUES
  ('PROGRAM_HEAD', 'PH - General Education',  'PH-0001', 'ph.gened@timecraft.edu',  '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Computer Studies',   'PH-0002', 'ph.ccse@timecraft.edu',   '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Nursing',             'PH-0003', 'ph.nursing@timecraft.edu','$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS')
ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.gened@timecraft.edu'   AND d.code = 'GEN_ED'
ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.ccse@timecraft.edu'    AND d.code = 'CCSE'
ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.nursing@timecraft.edu' AND d.code = 'CON'
ON CONFLICT DO NOTHING;