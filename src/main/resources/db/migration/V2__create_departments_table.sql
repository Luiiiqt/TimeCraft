-- ============================================================
-- V2: Departments, Colleges, and Courses
--
--  departments  → top-level grouping (colleges + General Education)
--  courses      → specific program under a department
--               (e.g. BS Information Technology under
--                College of Computer Studies and Engineering)
-- ============================================================

-- ── Departments / Colleges ────────────────────────────────────────────────────
CREATE TABLE departments (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL UNIQUE,
    code        VARCHAR(20)     NOT NULL UNIQUE,
    campus_id   BIGINT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ── Courses (programs under a department) ─────────────────────────────────────
CREATE TABLE courses (
    id              BIGSERIAL       PRIMARY KEY,
    department_id   BIGINT          NOT NULL,
    name            VARCHAR(150)    NOT NULL,
    code            VARCHAR(30)     NOT NULL UNIQUE,   -- e.g. BSIT, BSCS, BSN
    degree_level    VARCHAR(10)     NOT NULL CHECK (degree_level IN ('BACHELOR', 'MASTER', 'ASSOCIATE')),
    years_duration  SMALLINT        NOT NULL DEFAULT 4,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_courses_department
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT
);

-- ── Seed departments ──────────────────────────────────────────────────────────
INSERT INTO departments (name, code) VALUES
    ('General Education',                       'GEN_ED'),
    ('College of Nursing',                      'CON'),
    ('College of Radiologic Technology',        'CORT'),
    ('College of Medical Laboratory Science',   'CMLS'),
    ('College of Pharmacy',                     'COP'),
    ('College of Respiratory Therapy',          'CORT2'),
    ('College of Physical Therapy',             'COPT'),
    ('College of Psychology',                   'COPSY'),
    ('College of Computer Studies and Engineering', 'CCSE'),
    ('College of Business',                     'COB'),
    ('College of Special Needs Education',       'COL_IE');

-- ── Seed courses ──────────────────────────────────────────────────────────────

-- Health colleges (single course per college)
INSERT INTO courses (department_id, name, code, degree_level) VALUES
    ((SELECT id FROM departments WHERE code = 'CON'),   'Bachelor of Science in Nursing',                   'BSN',   'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'CORT'),  'Bachelor of Science in Radiologic Technology',     'BSRT',  'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'CMLS'),  'Bachelor of Science in Medical Laboratory Science','BSMLS', 'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'COP'),   'Bachelor of Science in Pharmacy',                  'BSPhar','BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'CORT2'), 'Bachelor of Science in Respiratory Therapy',       'BSREST', 'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'COL_IE'), 'Bachelor of Science in Special Needs Education',  'BSNED',  'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'COPT'),  'Bachelor of Science in Physical Therapy',          'BSPT',  'BACHELOR');

-- College of Psychology
INSERT INTO courses (department_id, name, code, degree_level) VALUES
    ((SELECT id FROM departments WHERE code = 'COPSY'), 'Bachelor of Arts in Psychology',      'ABPsy', 'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'COPSY'), 'Bachelor of Science in Psychology',   'BSPsy', 'BACHELOR');

-- College of Computer Studies and Engineering
INSERT INTO courses (department_id, name, code, degree_level) VALUES
    ((SELECT id FROM departments WHERE code = 'CCSE'), 'Bachelor of Science in Information Technology',  'BSIT',  'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'CCSE'), 'Bachelor of Science in Computer Science',        'BSCS',  'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'CCSE'), 'Bachelor of Science in Computer Engineering',    'BSCPE', 'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'CCSE'), 'Biomedical, Electronics and Computer Technology','BECT',   'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'CCSE'), 'Digital Imaging Technology',                     'DIT',   'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'CCSE'), 'Master in Information Systems',                  'MIS',   'MASTER');

-- College of Business
INSERT INTO courses (department_id, name, code, degree_level) VALUES
    ((SELECT id FROM departments WHERE code = 'COB'), 'Bachelor of Science in Tourism Management',      'BSTM', 'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'COB'), 'Bachelor of Science in Hospitality Management',  'BSHM', 'BACHELOR'),
    ((SELECT id FROM departments WHERE code = 'COB'), 'Bachelor of Science in Business Administration', 'BSBA', 'BACHELOR');

-- ── Wire FKs back to users now that departments and courses exist ──────────────
ALTER TABLE student_profiles
    ADD CONSTRAINT fk_student_dept
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_student_course
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE RESTRICT;

ALTER TABLE teacher_profiles
    ADD CONSTRAINT fk_teacher_dept
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT;

COMMENT ON TABLE  departments       IS 'Top-level academic units — colleges and General Education';
COMMENT ON TABLE  courses           IS 'Specific degree programs offered by each department';
COMMENT ON COLUMN courses.code      IS 'Short program code used system-wide e.g. BSIT, BSN, MIS';