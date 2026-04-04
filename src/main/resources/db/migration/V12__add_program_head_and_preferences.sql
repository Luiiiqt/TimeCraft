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
    CONSTRAINT chk_tsp_semester CHECK (semester IN ('1st', '2nd', 'Summer', 'FIRST', 'SECOND', 'FIRST_SEMESTER', 'SECOND_SEMESTER')),
    CONSTRAINT fk_tsp_course    FOREIGN KEY (course_id)     REFERENCES courses(id)  ON DELETE SET NULL
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

-- ── 5. Fix: CCSE has 2 PHs — drop the unique constraint on department_id ──────
ALTER TABLE program_head_profiles DROP CONSTRAINT IF EXISTS uq_ph_department;

-- ── 6. Seed all program heads ─────────────────────────────────────────────────
-- Password = "programhead123" (bcrypt)
INSERT INTO users (user_type, full_name, school_id, email, password_hash)
VALUES
  ('PROGRAM_HEAD', 'PH - Business',              'PH-0001', 'ph.cob@timecraft.edu',    '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Nursing',               'PH-0002', 'ph.con@timecraft.edu',    '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - CCSE (CS/IT/CpE)',      'PH-0003', 'ph.ccse1@timecraft.edu',  '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - CCSE (Biomed/DIT/MIS)', 'PH-0004', 'ph.ccse2@timecraft.edu',  '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Psychology',            'PH-0005', 'ph.copsy@timecraft.edu',  '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Pharmacy',              'PH-0006', 'ph.cop@timecraft.edu',    '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Physical Therapy',      'PH-0007', 'ph.copt@timecraft.edu',   '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Respiratory Therapy',   'PH-0008', 'ph.cort2@timecraft.edu',  '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Medical Laboratory',    'PH-0009', 'ph.cmls@timecraft.edu',   '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS'),
  ('PROGRAM_HEAD', 'PH - Radiologic Technology', 'PH-0010', 'ph.cort@timecraft.edu',   '$2a$12$bxHZLrm8Nf6O/wl/ITolm.pTgQpnLJoeGIvmYBI5dplrCK.DefUwS')
ON CONFLICT DO NOTHING;

-- ── 7. Seed program_head_profiles ─────────────────────────────────────────────
INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.cob@timecraft.edu'   AND d.code = 'COB'   ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.con@timecraft.edu'   AND d.code = 'CON'   ON CONFLICT DO NOTHING;

-- CCSE: 2 PHs, same department — constraint already dropped above
INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.ccse1@timecraft.edu' AND d.code = 'CCSE'  ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.ccse2@timecraft.edu' AND d.code = 'CCSE'  ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.copsy@timecraft.edu' AND d.code = 'COPSY' ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.cop@timecraft.edu'   AND d.code = 'COP'   ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.copt@timecraft.edu'  AND d.code = 'COPT'  ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.cort2@timecraft.edu' AND d.code = 'CORT2' ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.cmls@timecraft.edu'  AND d.code = 'CMLS'  ON CONFLICT DO NOTHING;

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'ph.cort@timecraft.edu'  AND d.code = 'CORT'  ON CONFLICT DO NOTHING;

-- ── 8. Seed program_head_courses ──────────────────────────────────────────────

-- COB — 3 courses
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.cob@timecraft.edu' AND c.code IN ('BSTM','BSHM','BSBA')
ON CONFLICT DO NOTHING;

-- CON — 1 course
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.con@timecraft.edu' AND c.code = 'BSN'
ON CONFLICT DO NOTHING;

-- CCSE PH1 — CS, IT, CpE
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.ccse1@timecraft.edu' AND c.code IN ('BSIT','BSCS','BSCpE')
ON CONFLICT DO NOTHING;

-- CCSE PH2 — Biomed, DIT, MIS
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.ccse2@timecraft.edu' AND c.code IN ('BECT','DIT','MIS')
ON CONFLICT DO NOTHING;

-- Psychology — 2 courses
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.copsy@timecraft.edu' AND c.code IN ('ABPsy','BSPsy')
ON CONFLICT DO NOTHING;

-- Pharmacy
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.cop@timecraft.edu' AND c.code = 'BSPhar'
ON CONFLICT DO NOTHING;

-- Physical Therapy
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.copt@timecraft.edu' AND c.code = 'BSPT'
ON CONFLICT DO NOTHING;

-- Respiratory Therapy
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.cort2@timecraft.edu' AND c.code = 'BSREST'
ON CONFLICT DO NOTHING;

-- Medical Laboratory Science
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.cmls@timecraft.edu' AND c.code = 'BSMLS'
ON CONFLICT DO NOTHING;

-- Radiologic Technology
INSERT INTO program_head_courses (ph_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'ph.cort@timecraft.edu' AND c.code = 'BSRT'
ON CONFLICT DO NOTHING;