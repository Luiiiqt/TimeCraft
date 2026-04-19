-- ============================================================
-- V14
--
-- Covers:
--   - Campuses (CLI, CHS)
--   - Departments (ITCS, CPE, GEN_ED)
--   - Courses (BSIT, BSCPE, BSCS)
--   - Rooms (301–306 LAB/LECTURE, 401–408 LECTURE)
--   - Teachers: ITCS (5), CPE (4), GEN_ED (22)
--
-- No dummy data. All teachers get:
--   email: firstname.lastname@lorma.edu
--   password: BCrypt of "Teacher123"
--   schoolId: generated unique 7-digit ID (24XXXXX series)
-- ============================================================

-- ── 1. CAMPUSES ───────────────────────────────────────────────────────────────

INSERT INTO campuses (name, code) VALUES
    ('Campus of Learning Innovation', 'CLI'),
    ('Campus of Health and Sciences',  'CHS')
ON CONFLICT (code) DO NOTHING;

-- ── 2. DEPARTMENTS ───────────────────────────────────────────────────────────

INSERT INTO departments (name, code, campus_id) VALUES
    ('Information Technology and Computer Science', 'ITCS',    (SELECT id FROM campuses WHERE code = 'CLI')),
    ('Computer Engineering',                        'CPE',     (SELECT id FROM campuses WHERE code = 'CLI')),
    ('General Education',                           'GEN_ED',  (SELECT id FROM campuses WHERE code = 'CLI'))
ON CONFLICT (code) DO NOTHING;

-- ── 3. COURSES ────────────────────────────────────────────────────────────────

INSERT INTO courses (name, code, department_id, degree_level) VALUES
    ('Bachelor of Science in Information Technology',     'BSIT',  (SELECT id FROM departments WHERE code = 'ITCS'), 'BACHELOR'),
    ('Bachelor of Science in Computer Engineering',       'BSCPE', (SELECT id FROM departments WHERE code = 'CPE'),  'BACHELOR'),
    ('Bachelor of Science in Computer Science',           'BSCS',  (SELECT id FROM departments WHERE code = 'ITCS'), 'BACHELOR')
ON CONFLICT (code) DO NOTHING;


-- Computer Labs 301–304: ITCS + CPE shared lab use
-- Room 305: CPE Hardware Lab
-- Room 306: Lecture room for ITCS and CPE
-- Rooms 401–408: General lecture rooms (CLI)

INSERT INTO rooms (name, room_number, room_type, capacity, campus_id, department_id) VALUES

    -- Computer Labs (ITCS + CPE shared)
    ('Computer Laboratory 301', '301', 'LABORATORY', 30, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Computer Laboratory 302', '302', 'LABORATORY', 30, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Computer Laboratory 303', '303', 'LABORATORY', 30, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Computer Laboratory 304', '304', 'LABORATORY', 30, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),

    -- CPE Hardware Lab
    ('Hardware Laboratory 305',  '305', 'LABORATORY', 30, (SELECT id FROM campuses WHERE code = 'CLI'), (SELECT id FROM departments WHERE code = 'CPE')),

    -- ITCS/CPE Lecture Room
    ('Lecture Room 306',         '306', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),

    -- General Lecture Rooms
    ('Lecture Room 401',         '401', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Lecture Room 402',         '402', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Lecture Room 403',         '403', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Lecture Room 404',         '404', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Lecture Room 405',         '405', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Lecture Room 406',         '406', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Lecture Room 407',         '407', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL),
    ('Lecture Room 408',         '408', 'LECTURE',    45, (SELECT id FROM campuses WHERE code = 'CLI'), NULL)

ON CONFLICT (room_number) DO NOTHING;

-- ── 5. TEACHERS ───────────────────────────────────────────────────────────────
-- BCrypt hash of "teacher@1234":
-- $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- (Standard bcrypt cost 10 — safe for seeding)

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ ITCS TEACHERS                                                           │
-- └─────────────────────────────────────────────────────────────────────────┘

INSERT INTO users (user_type, full_name, school_id, email, password_hash, is_active) VALUES
    ('TEACHER', 'Johnny F. Verzola',          '2417001', 'johnny.verzola@lorma.edu',         '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Mary-Ann L. Mzana',          '2417002', 'maryann.mzana@lorma.edu',           '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Tyrrone Gil R. Azusano',     '2417003', 'tyrronegil.azusano@lorma.edu',      '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Ellen Mangaoang',            '2417004', 'ellen.mangaoang@lorma.edu',         '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Janelli M. Mendez',          '2417005', 'janelli.mendez@lorma.edu',          '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO teacher_profiles (user_id, department_id, campus_flexible, is_ge_teacher) VALUES
    ((SELECT id FROM users WHERE email = 'johnny.verzola@lorma.edu'),      (SELECT id FROM departments WHERE code = 'ITCS'), false, false),
    ((SELECT id FROM users WHERE email = 'maryann.mzana@lorma.edu'),       (SELECT id FROM departments WHERE code = 'ITCS'), false, false),
    ((SELECT id FROM users WHERE email = 'tyrronegil.azusano@lorma.edu'),  (SELECT id FROM departments WHERE code = 'ITCS'), false, false),
    ((SELECT id FROM users WHERE email = 'ellen.mangaoang@lorma.edu'),     (SELECT id FROM departments WHERE code = 'ITCS'), false, false),
    ((SELECT id FROM users WHERE email = 'janelli.mendez@lorma.edu'),      (SELECT id FROM departments WHERE code = 'ITCS'), false, false)
ON CONFLICT (user_id) DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ CPE TEACHERS                                                            │
-- └─────────────────────────────────────────────────────────────────────────┘

INSERT INTO users (user_type, full_name, school_id, email, password_hash, is_active) VALUES
    ('TEACHER', 'Nicolette Estrella',         '2417006', 'nicolette.estrella@lorma.edu',     '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Gelo Ryan Carbonell',        '2417007', 'geloryan.carbonell@lorma.edu',     '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Shekiro Raposas',            '2417008', 'shekiro.raposas@lorma.edu',        '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Brianne Mark Aquino',        '2417009', 'briannemark.aquino@lorma.edu',     '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO teacher_profiles (user_id, department_id, campus_flexible, is_ge_teacher) VALUES
    ((SELECT id FROM users WHERE email = 'nicolette.estrella@lorma.edu'),  (SELECT id FROM departments WHERE code = 'CPE'), false, false),
    ((SELECT id FROM users WHERE email = 'geloryan.carbonell@lorma.edu'),  (SELECT id FROM departments WHERE code = 'CPE'), false, false),
    ((SELECT id FROM users WHERE email = 'shekiro.raposas@lorma.edu'),     (SELECT id FROM departments WHERE code = 'CPE'), false, false),
    ((SELECT id FROM users WHERE email = 'briannemark.aquino@lorma.edu'),  (SELECT id FROM departments WHERE code = 'CPE'), false, false)
ON CONFLICT (user_id) DO NOTHING;

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ GEN_ED TEACHERS                                                         │
-- │ campus_flexible = true (campus assigned later by GE Coordinator)        │
-- └─────────────────────────────────────────────────────────────────────────┘

INSERT INTO users (user_type, full_name, school_id, email, password_hash, is_active) VALUES
    ('TEACHER', 'Rodolfo Jr S. Natarte',              '2417010', 'rodolfo.natarte@lorma.edu',        '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Joshua B. Delfin',                   '2417011', 'joshua.delfin@lorma.edu',          '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Carl Jan Jendrix Cargamento',        '2417012', 'carljanjendrix.cargamento@lorma.edu', '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Reinalyn J. Bucsit',                 '2417013', 'reinalyn.bucsit@lorma.edu',        '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Melba C. Ano',                       '2417014', 'melba.ano@lorma.edu',              '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Roence Aaron O. Galvez',             '2417015', 'roenceaaron.galvez@lorma.edu',     '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Ana Louise B. Sebio',                '2417016', 'analouise.sebio@lorma.edu',        '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Blessie S. Corpuz',                  '2417017', 'blessie.corpuz@lorma.edu',         '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Neferthea N. Quinquito',             '2417018', 'neferthea.quinquito@lorma.edu',    '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Maridel A. Dulay',                   '2417019', 'maridel.dulay@lorma.edu',          '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'James R. Alfredo',                   '2417020', 'james.alfredo@lorma.edu',          '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Gladys W. Marcelo',                  '2417021', 'gladys.marcelo@lorma.edu',         '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Joylyn P. Baniaga',                  '2417022', 'joylyn.baniaga@lorma.edu',         '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Adrianne Paola Grace P. Dacanay',    '2417023', 'adriannepaola.dacanay@lorma.edu',  '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Kate Lyra Octaviano',                '2417024', 'katelyra.octaviano@lorma.edu',     '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Ariston S. Ansagay',                 '2417025', 'ariston.ansagay@lorma.edu',        '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'John Mark M. Marquez',               '2417026', 'johnmark.marquez@lorma.edu',       '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Wayne Tabion',                       '2417027', 'wayne.tabion@lorma.edu',           '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Elizabeth D. Aceituno',              '2417028', 'elizabeth.aceituno@lorma.edu',     '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Princess Lloyda S. Peralta',         '2417029', 'princesslloyda.peralta@lorma.edu', '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Rolando Jr. Nabua',                  '2417030', 'rolando.nabua@lorma.edu',          '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Roda Canono',                        '2417031', 'roda.canono@lorma.edu',            '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Khrystelle Joy M. Apilado',          '2417032', 'khrystellejoy.apilado@lorma.edu',  '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Angelica L. Balaguer',               '2417033', 'angelica.balaguer@lorma.edu',      '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Marianito R. Dacanay',               '2417034', 'marianito.dacanay@lorma.edu',      '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'John Stephen D. Gois',               '2417035', 'johnstephen.gois@lorma.edu',       '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Ericson M. Javillo',                 '2417036', 'ericson.javillo@lorma.edu',        '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Maria Delia I. Libao',               '2417037', 'mariadelia.libao@lorma.edu',       '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Grace G. Nabalan',                   '2417038', 'grace.nabalan@lorma.edu',          '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Crisanta C. Nebrida',                '2417039', 'crisanta.nebrida@lorma.edu',       '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Jetro M. Novero',                    '2417040', 'jetro.novero@lorma.edu',           '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true),
    ('TEACHER', 'Andrew Cesar M. Rimando',            '2417041', 'andrew.rimando@lorma.edu',         '$2a$12$.YujI0qvc61d1cFA2/52ae9qgGhlcaXFLIfnsfAEof6/nK6mhxjLS', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO teacher_profiles (user_id, department_id, campus_flexible, is_ge_teacher) VALUES
((SELECT id FROM users WHERE email = 'james.alfredo@lorma.edu'),        (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'melba.ano@lorma.edu'),            (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'khrystellejoy.apilado@lorma.edu'),(SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'angelica.balaguer@lorma.edu'),    (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'joylyn.baniaga@lorma.edu'),       (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'reinalyn.bucsit@lorma.edu'),      (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'roda.canono@lorma.edu'),          (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'carljanjendrix.cargamento@lorma.edu'), (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'blessie.corpuz@lorma.edu'),       (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'marianito.dacanay@lorma.edu'),    (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'adriannepaola.dacanay@lorma.edu'),(SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'joshua.delfin@lorma.edu'),        (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'maridel.dulay@lorma.edu'),        (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'roenceaaron.galvez@lorma.edu'),   (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'johnstephen.gois@lorma.edu'),     (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'ericson.javillo@lorma.edu'),      (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'mariadelia.libao@lorma.edu'),     (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'gladys.marcelo@lorma.edu'),       (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'johnmark.marquez@lorma.edu'),     (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'grace.nabalan@lorma.edu'),        (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'rolando.nabua@lorma.edu'),        (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'rodolfo.natarte@lorma.edu'),      (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'crisanta.nebrida@lorma.edu'),     (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'jetro.novero@lorma.edu'),         (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'princesslloyda.peralta@lorma.edu'), (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'neferthea.quinquito@lorma.edu'),  (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'andrew.rimando@lorma.edu'),       (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'analouise.sebio@lorma.edu'),      (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'wayne.tabion@lorma.edu'),         (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'katelyra.octaviano@lorma.edu'),   (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'ariston.ansagay@lorma.edu'),      (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true),
((SELECT id FROM users WHERE email = 'elizabeth.aceituno@lorma.edu'),   (SELECT id FROM departments WHERE code = 'GEN_ED'), true, true)
ON CONFLICT (user_id) DO NOTHING;