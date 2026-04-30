-- ============================================================
-- V22: Seed Program Heads
--
-- Covers:
--   - Departments for all colleges
--   - Courses per college
--   - Program Head user accounts
--   - program_head_profiles
--   - dean_courses (PH ↔ course mapping)
--
-- Password: BCrypt of "Teacher123"
-- $2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6
-- ============================================================

-- ── 1. DEPARTMENTS ────────────────────────────────────────────────────────────

INSERT INTO departments (name, code, campus_id) VALUES
    ('College of Business',                   'COB',   (SELECT id FROM campuses WHERE code = 'CLI')),
    ('College of Pharmacy',                   'COP',   (SELECT id FROM campuses WHERE code = 'CHS')),
    ('College of Nursing',                    'CON',   (SELECT id FROM campuses WHERE code = 'CHS')),
    ('College of Inclusive Education',        'CIED',  (SELECT id FROM campuses WHERE code = 'CHS')),
    ('College of Psychology',                 'COPSY', (SELECT id FROM campuses WHERE code = 'CHS')),
    ('College of Physical Therapy',           'COPT',  (SELECT id FROM campuses WHERE code = 'CHS')),
    ('College of Respiratory Therapy',        'CORT',  (SELECT id FROM campuses WHERE code = 'CHS')),
    ('College of Medical Laboratory Science', 'COMLS', (SELECT id FROM campuses WHERE code = 'CHS')),
    ('College of Radiologic Technology',      'CORT2', (SELECT id FROM campuses WHERE code = 'CHS'))
ON CONFLICT DO NOTHING;

-- ── 2. COURSES ────────────────────────────────────────────────────────────────

INSERT INTO courses (name, code, department_id, degree_level)
SELECT v.course_name, v.course_code, d.id, v.degree_level FROM (VALUES
    ('Bachelor of Science in Business Administration', 'BSBA',  'COB',   'BACHELOR'),
    ('Bachelor of Science in Hospitality Management',  'BSHM',  'COB',   'BACHELOR'),
    ('Bachelor of Science in Tourism Management',      'BSTM',  'COB',   'BACHELOR'),
    ('Bachelor of Science in Pharmacy',                'BSP',   'COP',   'BACHELOR'),
    ('Bachelor of Science in Nursing',                 'BSN',   'CON',   'BACHELOR'),
    ('Master of Arts in Nursing',                      'MAN',   'CON',   'MASTER'),
    ('Bachelor in Special Needs Education',            'BSNED', 'CIED',  'BACHELOR'),
    ('Bachelor of Science in Psychology',              'BSPSY', 'COPSY', 'BACHELOR'),
    ('Bachelor of Arts Major in Psychology',           'ABPSY', 'COPSY', 'BACHELOR'),
    ('Bachelor of Science in Exercise and Sports Sciences', 'BSESS', 'COPT', 'BACHELOR'),
    ('Bachelor of Science in Physical Therapy',        'BSPT',  'COPT',  'BACHELOR'),
    ('Bachelor of Science in Respiratory Therapy',     'BSRT',  'CORT',  'BACHELOR'),
    ('Bachelor of Science in Medical Laboratory Science', 'BSMLS', 'COMLS', 'BACHELOR'),
    ('Bachelor of Science in Radiologic Technology',   'BSRADTECH', 'CORT2', 'BACHELOR'),
    ('Bachelor of Science in Biomedical Engineering',  'BSBME', 'ITCS',  'BACHELOR'),
    ('Bachelor of Science in Electronics and Computer Technology', 'BSECT', 'ITCS', 'BACHELOR'),
    ('Bachelor of Science in Digital Imaging Technology', 'BSDIT', 'ITCS', 'BACHELOR'),
    ('Master of Science in Information Systems',       'MSIS',  'ITCS',  'MASTER')
) AS v(course_name, course_code, dept_code, degree_level)
JOIN departments d ON d.code = v.dept_code
ON CONFLICT (code) DO NOTHING;

-- ── 3. PROGRAM HEAD USERS ────────────────────────────────────────────────────

INSERT INTO users (user_type, full_name, school_id, email, password_hash, is_active) VALUES
    ('PROGRAM_HEAD', 'College of Business Program Head',                   'PH-COB-001',   'ph.business@lorma.edu',         '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'College of Pharmacy Program Head',                   'PH-COP-001',   'ph.pharmacy@lorma.edu',         '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'College of Nursing Program Head',                    'PH-CON-001',   'ph.nursing@lorma.edu',          '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'College of Inclusive Education Program Head',        'PH-CIED-001',  'ph.inclusiveduc@lorma.edu',     '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'College of Psychology Program Head',                 'PH-COPSY-001', 'ph.psychology@lorma.edu',       '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'College of Physical Therapy Program Head',           'PH-COPT-001',  'ph.physicaltherapy@lorma.edu',  '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'College of Respiratory Therapy Program Head',        'PH-CORT-001',  'ph.respiratorytherapy@lorma.edu','$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'College of Medical Laboratory Science Program Head', 'PH-COMLS-001', 'ph.medlabscience@lorma.edu',    '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'College of Radiologic Technology Program Head',      'PH-CORT2-001', 'ph.radtech@lorma.edu',          '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'CCSE Program Head - CS IT CE',                       'PH-CCSE-001',  'ph.ccse1@lorma.edu',            '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true),
    ('PROGRAM_HEAD', 'CCSE Program Head - BME ECT DIT MIS',               'PH-CCSE-002',  'ph.ccse2@lorma.edu',            '$2a$12$gji5i/N1mjGxALvRr8fQJuPGQ41ZXn2DveNYrZv1xk9n/nq1tPHr6', true)
ON CONFLICT (email) DO NOTHING;

-- ── 4. PROGRAM HEAD PROFILES ──────────────────────────────────────────────────

INSERT INTO program_head_profiles (user_id, department_id)
SELECT u.id, d.id FROM (VALUES
    ('ph.business@lorma.edu',          'COB'),
    ('ph.pharmacy@lorma.edu',          'COP'),
    ('ph.nursing@lorma.edu',           'CON'),
    ('ph.inclusiveduc@lorma.edu',      'CIED'),
    ('ph.psychology@lorma.edu',        'COPSY'),
    ('ph.physicaltherapy@lorma.edu',   'COPT'),
    ('ph.respiratorytherapy@lorma.edu','CORT'),
    ('ph.medlabscience@lorma.edu',     'COMLS'),
    ('ph.radtech@lorma.edu',           'CORT2'),
    ('ph.ccse1@lorma.edu',             'ITCS'),
    ('ph.ccse2@lorma.edu',             'ITCS')
) AS v(email, dept_code)
JOIN users u ON u.email = v.email
JOIN departments d ON d.code = v.dept_code
ON CONFLICT (user_id) DO NOTHING;

-- ── 5. DEAN_COURSES (PH ↔ Course mapping) ────────────────────────────────────

INSERT INTO dean_courses (dean_user_id, course_id) VALUES
    -- College of Business PH
    ((SELECT id FROM users WHERE email = 'ph.business@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSBA')),
    ((SELECT id FROM users WHERE email = 'ph.business@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSHM')),
    ((SELECT id FROM users WHERE email = 'ph.business@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSTM')),

    -- College of Pharmacy PH
    ((SELECT id FROM users WHERE email = 'ph.pharmacy@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSP')),

    -- College of Nursing PH
    ((SELECT id FROM users WHERE email = 'ph.nursing@lorma.edu'),  (SELECT id FROM courses WHERE code = 'BSN')),
    ((SELECT id FROM users WHERE email = 'ph.nursing@lorma.edu'),  (SELECT id FROM courses WHERE code = 'MAN')),

    -- College of Inclusive Education PH
    ((SELECT id FROM users WHERE email = 'ph.inclusiveduc@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSNED')),

    -- College of Psychology PH
    ((SELECT id FROM users WHERE email = 'ph.psychology@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSPSY')),
    ((SELECT id FROM users WHERE email = 'ph.psychology@lorma.edu'), (SELECT id FROM courses WHERE code = 'ABPSY')),

    -- College of Physical Therapy PH
    ((SELECT id FROM users WHERE email = 'ph.physicaltherapy@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSESS')),
    ((SELECT id FROM users WHERE email = 'ph.physicaltherapy@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSPT')),

    -- College of Respiratory Therapy PH
    ((SELECT id FROM users WHERE email = 'ph.respiratorytherapy@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSRT')),

    -- College of Medical Laboratory Science PH
    ((SELECT id FROM users WHERE email = 'ph.medlabscience@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSMLS')),

    -- College of Radiologic Technology PH
    ((SELECT id FROM users WHERE email = 'ph.radtech@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSRADTECH')),

    -- CCSE PH 1: BSCS, BSIT, BSCPE
    ((SELECT id FROM users WHERE email = 'ph.ccse1@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSCS')),
    ((SELECT id FROM users WHERE email = 'ph.ccse1@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSIT')),
    ((SELECT id FROM users WHERE email = 'ph.ccse1@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSCPE')),

    -- CCSE PH 2: BSBME, BSECT, BSDIT, MSIS
    ((SELECT id FROM users WHERE email = 'ph.ccse2@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSBME')),
    ((SELECT id FROM users WHERE email = 'ph.ccse2@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSECT')),
    ((SELECT id FROM users WHERE email = 'ph.ccse2@lorma.edu'), (SELECT id FROM courses WHERE code = 'BSDIT')),
    ((SELECT id FROM users WHERE email = 'ph.ccse2@lorma.edu'), (SELECT id FROM courses WHERE code = 'MSIS'))

ON CONFLICT (dean_user_id, course_id) DO NOTHING;