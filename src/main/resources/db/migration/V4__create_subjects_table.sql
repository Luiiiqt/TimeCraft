-- ============================================================
-- V4: Subjects
--
--  subject_type  : MAJOR | MINOR
--  session_type  : LECTURE | LABORATORY
--  duration_mins : 90 (1 hr 30 min) for all types
--  sessions_per_week: 2 (twice per week) for all types
--
--  course_subjects: maps which subjects belong to which course
--                   (allows shared subjects across courses,
--                    e.g. BSIT and BSCS share common subjects)
-- ============================================================

CREATE TABLE subjects (
    id                  BIGSERIAL       PRIMARY KEY,
    name                VARCHAR(200)    NOT NULL,
    code                VARCHAR(30)     NOT NULL UNIQUE,
    subject_type        VARCHAR(10)     NOT NULL CHECK (subject_type IN ('MAJOR', 'MINOR')),
    session_type        VARCHAR(15)     NOT NULL CHECK (session_type IN ('LECTURE', 'LABORATORY')),
    duration_mins       SMALLINT        NOT NULL DEFAULT 90
                                        CHECK (duration_mins = 90),
    sessions_per_week   SMALLINT        NOT NULL DEFAULT 2
                                        CHECK (sessions_per_week BETWEEN 1 AND 3),
    units               SMALLINT        NOT NULL DEFAULT 3,
    department_id       BIGINT          NOT NULL,   -- owning department
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_subjects_department
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT
);

-- Maps subjects to courses — one subject can belong to many courses
-- is_shared = TRUE means the subject appears in multiple courses (e.g. BSIT + BSCS)
CREATE TABLE course_subjects (
    id              BIGSERIAL   PRIMARY KEY,
    course_id       BIGINT      NOT NULL,
    subject_id      BIGINT      NOT NULL,
    year_level      SMALLINT    NOT NULL CHECK (year_level BETWEEN 1 AND 5),
    semester        VARCHAR(20) NOT NULL CHECK (semester IN ('1st', '2nd', 'Summer', 'FIRST_SEMESTER', 'SECOND_SEMESTER')),
    is_shared       BOOLEAN     NOT NULL DEFAULT FALSE,   -- TRUE = common with another course

    CONSTRAINT fk_course_subjects_course
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT fk_course_subjects_subject
        FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT uq_course_subject_year_sem
        UNIQUE (course_id, subject_id, year_level, semester)
);

-- ── Seed: General Education (Minor) subjects ──────────────────────────────────
INSERT INTO subjects (name, code, subject_type, session_type, units, department_id) VALUES
    ('Understanding the Self',              'GE-US',    'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('Readings in Philippine History',      'GE-RPH',   'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('The Contemporary World',              'GE-TCW',   'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('Mathematics in the Modern World',     'GE-MMW',   'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('Purposive Communication',             'GE-PC',    'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('Art Appreciation',                    'GE-AA',    'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('Science, Technology and Society',     'GE-STS',   'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('Ethics',                              'GE-ETH',   'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('Physical Education 1',               'PE-1',     'MINOR', 'LECTURE', 2, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('Physical Education 2',               'PE-2',     'MINOR', 'LECTURE', 2, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('National Service Training Program 1','NSTP-1',   'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED')),
    ('National Service Training Program 2','NSTP-2',   'MINOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'GEN_ED'));

-- ── Seed: BSIT and BSCS shared MAJOR subjects ────────────────────────────────
INSERT INTO subjects (name, code, subject_type, session_type, units, department_id) VALUES
    ('Introduction to Computing',           'IT-IC',    'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Computer Programming 1',              'IT-CP1',   'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Computer Programming 2',              'IT-CP2',   'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Data Structures and Algorithms',      'IT-DSA',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Discrete Mathematics',                'IT-DM',    'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Information Assurance and Security',  'IT-IAS',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Object Oriented Programming',         'IT-OOP',   'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Database Management Systems',         'IT-DBMS',  'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Operating Systems',                   'IT-OS',    'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Computer Networks',                   'IT-CN',    'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE'));

-- ── Seed: BSIT-only MAJOR subjects ───────────────────────────────────────────
INSERT INTO subjects (name, code, subject_type, session_type, units, department_id) VALUES
    ('Web Systems and Technologies',        'IT-WST',   'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Systems Integration and Architecture','IT-SIA',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('IT Infrastructure and Architecture',  'IT-ITIA',  'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Networking 1',                        'IT-NET1',  'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Networking 2',                        'IT-NET2',  'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Systems Analysis and Design',         'IT-SAD',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Capstone Project 1 (IT)',             'IT-CAP1',  'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Capstone Project 2 (IT)',             'IT-CAP2',  'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE'));

-- ── Seed: BSCS-only MAJOR subjects ───────────────────────────────────────────
INSERT INTO subjects (name, code, subject_type, session_type, units, department_id) VALUES
    ('Algorithm Design and Analysis',       'CS-ADA',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Theory of Computation',               'CS-TOC',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Programming Languages',               'CS-PL',    'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Software Engineering',                'CS-SE',    'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Artificial Intelligence',             'CS-AI',    'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Machine Learning',                    'CS-ML',    'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Compiler Design',                     'CS-CD',    'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Capstone Project 1 (CS)',             'CS-CAP1',  'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE')),
    ('Capstone Project 2 (CS)',             'CS-CAP2',  'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'CCSE'));

-- ── Seed: AB Psychology and BS Psychology shared subjects ─────────────────────
INSERT INTO subjects (name, code, subject_type, session_type, units, department_id) VALUES
    ('Introduction to Psychology',              'PSY-IP',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Developmental Psychology',                'PSY-DP',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Social Psychology',                       'PSY-SP',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Abnormal Psychology',                     'PSY-AP',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Psychological Statistics',                'PSY-PS',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Personality Theories',                    'PSY-PT',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Research Methods in Psychology',          'PSY-RM',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY'));

-- ── Seed: AB Psychology distinct subjects ────────────────────────────────────
INSERT INTO subjects (name, code, subject_type, session_type, units, department_id) VALUES
    ('Filipino Psychology (Sikolohiyang Pilipino)','ABP-FP', 'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Community Psychology',                    'ABP-CP',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Organizational Psychology',               'ABP-OP',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY'));

-- ── Seed: BS Psychology distinct subjects ────────────────────────────────────
INSERT INTO subjects (name, code, subject_type, session_type, units, department_id) VALUES
    ('Biological Bases of Behavior',            'BSP-BB',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Cognitive Psychology',                    'BSP-CG',   'MAJOR', 'LECTURE', 3, (SELECT id FROM departments WHERE code = 'COPSY')),
    ('Psychological Assessment',                'BSP-PA',   'MAJOR', 'LABORATORY', 3, (SELECT id FROM departments WHERE code = 'COPSY'));

-- ── Wire course_subjects: BSIT Year 1, Semester 1 ───────────────────────────
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    -- Shared with BSCS
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'GE-US'),   1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'GE-MMW'),  1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'GE-PC'),   1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'PE-1'),    1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'NSTP-1'),  1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-IC'),   1, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-CP1'),  1, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-DM'),   1, '1st', TRUE);

-- BSIT Year 1, Semester 2
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'GE-RPH'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'GE-TCW'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'PE-2'),    1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'NSTP-2'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-CP2'),  1, '2nd', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-OOP'),  1, '2nd', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-DSA'),  1, '2nd', TRUE);

-- BSIT Year 2, Semester 1
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'GE-AA'),   2, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'GE-STS'),  2, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-DBMS'), 2, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-OS'),   2, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-WST'),  2, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-CN'),   2, '1st', TRUE);

-- BSIT Year 2, Semester 2
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'GE-ETH'),  2, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-IAS'),  2, '2nd', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-SAD'),  2, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-NET1'), 2, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSIT'), (SELECT id FROM subjects WHERE code = 'IT-SIA'),  2, '2nd', FALSE);

-- ── Wire course_subjects: BSCS Year 1, Semester 1 ────────────────────────────
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'GE-US'),   1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'GE-MMW'),  1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'GE-PC'),   1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'PE-1'),    1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'NSTP-1'),  1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-IC'),   1, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-CP1'),  1, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-DM'),   1, '1st', TRUE);

-- BSCS Year 1, Semester 2
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'GE-RPH'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'GE-TCW'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'PE-2'),    1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'NSTP-2'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-CP2'),  1, '2nd', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-OOP'),  1, '2nd', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-DSA'),  1, '2nd', TRUE);

-- BSCS Year 2, Semester 1 (CS-specific subjects start)
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'GE-AA'),   2, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'GE-STS'),  2, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-DBMS'), 2, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-OS'),   2, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'CS-ADA'),  2, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSCS'), (SELECT id FROM subjects WHERE code = 'IT-CN'),   2, '1st', TRUE);

-- ── Wire course_subjects: AB Psychology Year 1, Semester 1 ───────────────────
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'GE-US'),   1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'GE-PC'),   1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'GE-MMW'),  1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'PE-1'),    1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'NSTP-1'),  1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'PSY-IP'),  1, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'PSY-DP'),  1, '1st', TRUE);

-- AB Psychology Year 1, Semester 2
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'GE-RPH'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'PE-2'),    1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'NSTP-2'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'PSY-SP'),  1, '2nd', TRUE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'ABP-FP'),  1, '2nd', FALSE),
    ((SELECT id FROM courses WHERE code = 'ABPsy'), (SELECT id FROM subjects WHERE code = 'ABP-CP'),  1, '2nd', FALSE);

-- ── Wire course_subjects: BS Psychology Year 1, Semester 1 ───────────────────
INSERT INTO course_subjects (course_id, subject_id, year_level, semester, is_shared) VALUES
    ((SELECT id FROM courses WHERE code = 'BSPsy'), (SELECT id FROM subjects WHERE code = 'GE-US'),   1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSPsy'), (SELECT id FROM subjects WHERE code = 'GE-PC'),   1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSPsy'), (SELECT id FROM subjects WHERE code = 'GE-MMW'),  1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSPsy'), (SELECT id FROM subjects WHERE code = 'PE-1'),    1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSPsy'), (SELECT id FROM subjects WHERE code = 'NSTP-1'),  1, '1st', FALSE),
    ((SELECT id FROM courses WHERE code = 'BSPsy'), (SELECT id FROM subjects WHERE code = 'PSY-IP'),  1, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSPsy'), (SELECT id FROM subjects WHERE code = 'PSY-DP'),  1, '1st', TRUE),
    ((SELECT id FROM courses WHERE code = 'BSPsy'), (SELECT id FROM subjects WHERE code = 'BSP-BB'),  1, '1st', FALSE);

COMMENT ON TABLE  subjects                  IS 'All subjects — MAJOR or MINOR, LECTURE or LABORATORY, always 90 min / 2x per week';
COMMENT ON COLUMN subjects.subject_type     IS 'MAJOR | MINOR';
COMMENT ON COLUMN subjects.session_type     IS 'LECTURE | LABORATORY — must match room type when scheduling';
COMMENT ON COLUMN subjects.duration_mins    IS 'Always 90 minutes (1 hr 30 min) per session';
COMMENT ON COLUMN subjects.sessions_per_week IS 'Typically 2 — subject meets twice per week';
COMMENT ON TABLE  course_subjects           IS 'Curriculum map — which subjects belong to which course, at which year/semester';
COMMENT ON COLUMN course_subjects.is_shared IS 'TRUE = this subject is shared between two or more courses (e.g. BSIT + BSCS)';