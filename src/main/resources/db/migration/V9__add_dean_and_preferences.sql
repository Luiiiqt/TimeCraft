-- ── 1. Extend user_type to include PROGRAM_HEAD ───────────────────────────────
ALTER TABLE users DROP CONSTRAINT users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('STUDENT', 'TEACHER', 'ADMIN', 'DEAN', 'PROGRAM_HEAD'));

-- ── 2. Program head profiles ──────────────────────────────────────────────────
CREATE TABLE dean_profiles (
    user_id         BIGINT      PRIMARY KEY,
    department_id   BIGINT      NOT NULL,
    CONSTRAINT fk_dean_user       FOREIGN KEY (user_id)       REFERENCES users(id)        ON DELETE CASCADE,
    CONSTRAINT fk_dean_department FOREIGN KEY (department_id) REFERENCES departments(id)  ON DELETE RESTRICT,
    CONSTRAINT uq_dean_department UNIQUE (department_id)
);

-- Maps which courses each Program Head manages
-- Supports CCSE having 2 Program Heads split across courses
CREATE TABLE dean_courses (
    dean_user_id BIGINT NOT NULL,
    course_id    BIGINT NOT NULL,
    PRIMARY KEY (dean_user_id, course_id),
    CONSTRAINT fk_dc_user   FOREIGN KEY (dean_user_id) REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_dc_course FOREIGN KEY (course_id)    REFERENCES courses(id)  ON DELETE CASCADE
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
    reviewed_by     BIGINT,     -- dean user_id
    CONSTRAINT fk_tsp_teacher   FOREIGN KEY (teacher_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_tsp_subject   FOREIGN KEY (subject_id)    REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tsp_reviewer  FOREIGN KEY (reviewed_by)   REFERENCES users(id)    ON DELETE SET NULL,
    CONSTRAINT uq_tsp           UNIQUE (teacher_id, subject_id, semester, school_year),
    CONSTRAINT chk_tsp_status   CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_tsp_semester CHECK (semester IN ('1st', '2nd', 'Summer')),
    CONSTRAINT fk_tsp_course    FOREIGN KEY (course_id)     REFERENCES courses(id)  ON DELETE SET NULL
);

-- ── 4. Subject assignments (program head finalizes teacher → subject) ─────────
CREATE TABLE subject_assignments (
    id              BIGSERIAL   PRIMARY KEY,
    subject_id      BIGINT      NOT NULL,
    section_id      BIGINT      NOT NULL,
    teacher_id      BIGINT      NOT NULL,
    assigned_by     BIGINT      NOT NULL,   -- dean user_id
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
ALTER TABLE dean_profiles DROP CONSTRAINT IF EXISTS uq_dean_department;

-- ── 6. Seed all deans ─────────────────────────────────────────────────────────
-- Password = "Dean@123" (bcrypt)
INSERT INTO users (user_type, full_name, school_id, email, password_hash)
VALUES
  ('DEAN', 'Dean - Business',              'DEAN-0001', 'dean.cob@timecraft.edu',   '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe'),
  ('DEAN', 'Dean - Nursing',               'DEAN-0002', 'dean.con@timecraft.edu',   '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe'),
  ('DEAN', 'Dean - CCSE',                  'DEAN-0003', 'dean.ccse@timecraft.edu',  '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe'),
  ('DEAN', 'Dean - Psychology',            'DEAN-0005', 'dean.copsy@timecraft.edu', '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe'),
  ('DEAN', 'Dean - Pharmacy',              'DEAN-0006', 'dean.cop@timecraft.edu',   '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe'),
  ('DEAN', 'Dean - Physical Therapy',      'DEAN-0007', 'dean.copt@timecraft.edu',  '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe'),
  ('DEAN', 'Dean - Respiratory Therapy',   'DEAN-0008', 'dean.cort2@timecraft.edu', '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe'),
  ('DEAN', 'Dean - Medical Laboratory',    'DEAN-0009', 'dean.cmls@timecraft.edu',  '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe'),
  ('DEAN', 'Dean - Radiologic Technology', 'DEAN-0010', 'dean.cort@timecraft.edu',  '$2a$12$wefQ5YH6FadChnfjBkiWJOwFwzS9GeZgegPTlFkXwkCqroc645hPe')
ON CONFLICT DO NOTHING;

-- ── 7. Seed dean_profiles ─────────────────────────────────────────────────────
INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.cob@timecraft.edu'   AND d.code = 'COB'   ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.con@timecraft.edu'   AND d.code = 'CON'   ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.ccse1@timecraft.edu' AND d.code = 'CCSE'  ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.ccse2@timecraft.edu' AND d.code = 'CCSE'  ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.copsy@timecraft.edu' AND d.code = 'COPSY' ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.cop@timecraft.edu'   AND d.code = 'COP'   ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.copt@timecraft.edu'  AND d.code = 'COPT'  ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.cort2@timecraft.edu' AND d.code = 'CORT2' ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.cmls@timecraft.edu'  AND d.code = 'CMLS'  ON CONFLICT DO NOTHING;

INSERT INTO dean_profiles (user_id, department_id)
SELECT u.id, d.id FROM users u, departments d
WHERE u.email = 'dean.cort@timecraft.edu'  AND d.code = 'CORT'  ON CONFLICT DO NOTHING;

-- ── 8. Seed dean_courses ──────────────────────────────────────────────────────

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.cob@timecraft.edu' AND c.code IN ('BSTM','BSHM','BSBA')
ON CONFLICT DO NOTHING;

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.con@timecraft.edu' AND c.code = 'BSN'
ON CONFLICT DO NOTHING;

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.ccse@timecraft.edu' AND c.code IN ('BSIT','BSCS','BSCPE','BECT','DIT','MIS')
ON CONFLICT DO NOTHING;

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.copsy@timecraft.edu' AND c.code IN ('ABPsy','BSPsy')
ON CONFLICT DO NOTHING;

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.cop@timecraft.edu' AND c.code = 'BSPhar'
ON CONFLICT DO NOTHING;

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.copt@timecraft.edu' AND c.code = 'BSPT'
ON CONFLICT DO NOTHING;

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.cort2@timecraft.edu' AND c.code = 'BSREST'
ON CONFLICT DO NOTHING;

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.cmls@timecraft.edu' AND c.code = 'BSMLS'
ON CONFLICT DO NOTHING;

INSERT INTO dean_courses (dean_user_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.email = 'dean.cort@timecraft.edu' AND c.code = 'BSRT'
ON CONFLICT DO NOTHING;