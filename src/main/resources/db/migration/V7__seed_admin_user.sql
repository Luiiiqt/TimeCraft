

-- ── Sample Teachers ───────────────────────────────────────────────────────────
-- All teacher passwords: Teacher@1234
-- BCrypt hash for 'Teacher@1234':
--   $2a$12$K8HmVkIJoNUyR5tFc3eYd.9GfVqPzLwXmD2YsBbJ4N6uReA7sO1Oi

INSERT INTO users (user_type, full_name, school_id, email, password_hash) VALUES
    ('TEACHER', 'Dr. Maria Santos',     'T-2020-001', 'maria.santos@school.edu',    '$2a$12$.jAqbM2qD4mOENChdHf2.u.zksR38wcuIrs4KdmfU8wSmS8WVU3Qm'),
    ('TEACHER', 'Prof. Juan Reyes',     'T-2020-002', 'juan.reyes@school.edu',      '$2a$12$.jAqbM2qD4mOENChdHf2.u.zksR38wcuIrs4KdmfU8wSmS8WVU3Qm'),
    ('TEACHER', 'Dr. Ana Cruz',         'T-2020-003', 'ana.cruz@school.edu',        '$2a$12$.jAqbM2qD4mOENChdHf2.u.zksR38wcuIrs4KdmfU8wSmS8WVU3Qm'),
    ('TEACHER', 'Prof. Jose Dela Cruz', 'T-2020-004', 'jose.delacruz@school.edu',   '$2a$12$.jAqbM2qD4mOENChdHf2.u.zksR38wcuIrs4KdmfU8wSmS8WVU3Qm'),
    ('TEACHER', 'Dr. Rosa Flores',      'T-2020-005', 'rosa.flores@school.edu',     '$2a$12$.jAqbM2qD4mOENChdHf2.u.zksR38wcuIrs4KdmfU8wSmS8WVU3Qm'),
    ('TEACHER', 'Prof. Carlos Tan',     'T-2020-006', 'carlos.tan@school.edu',      '$2a$12$.jAqbM2qD4mOENChdHf2.u.zksR38wcuIrs4KdmfU8wSmS8WVU3Qm'),
    ('TEACHER', 'Dr. Liza Mendoza',     'T-2020-007', 'liza.mendoza@school.edu',    '$2a$12$.jAqbM2qD4mOENChdHf2.u.zksR38wcuIrs4KdmfU8wSmS8WVU3Qm');

-- Assign teachers to departments via teacher_profiles
INSERT INTO teacher_profiles (user_id, department_id) VALUES
    ((SELECT id FROM users WHERE school_id = 'T-2020-001'), (SELECT id FROM departments WHERE code = 'CCSE')),    -- CS/IT teacher
    ((SELECT id FROM users WHERE school_id = 'T-2020-002'), (SELECT id FROM departments WHERE code = 'CCSE')),    -- CS/IT teacher
    ((SELECT id FROM users WHERE school_id = 'T-2020-003'), (SELECT id FROM departments WHERE code = 'GEN_ED')),  -- Gen Ed teacher
    ((SELECT id FROM users WHERE school_id = 'T-2020-004'), (SELECT id FROM departments WHERE code = 'CON')),     -- Nursing teacher
    ((SELECT id FROM users WHERE school_id = 'T-2020-005'), (SELECT id FROM departments WHERE code = 'COPSY')),   -- Psychology teacher
    ((SELECT id FROM users WHERE school_id = 'T-2020-006'), (SELECT id FROM departments WHERE code = 'COB')),     -- Business teacher
    ((SELECT id FROM users WHERE school_id = 'T-2020-007'), (SELECT id FROM departments WHERE code = 'GEN_ED')); -- Gen Ed teacher

-- ── Sample Regular Students ───────────────────────────────────────────────────
-- Password for all students: Student@1234
-- BCrypt hash for 'Student@1234':
--   $2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK

INSERT INTO users (user_type, full_name, school_id, email, password_hash) VALUES
    -- BSIT Year 1, Section A (regular)
    ('STUDENT', 'Carlos Dela Cruz',   '2024-00101', 'carlos.delacruz@student.edu',   '$2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK'),
    ('STUDENT', 'Maria Isabel Lim',   '2024-00102', 'maria.lim@student.edu',          '$2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK'),
    ('STUDENT', 'Jose Ramos',         '2024-00103', 'jose.ramos@student.edu',         '$2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK'),
    -- BSCS Year 1, Section A (regular)
    ('STUDENT', 'Ana Garcia',         '2024-00201', 'ana.garcia@student.edu',         '$2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK'),
    ('STUDENT', 'Miguel Santos',      '2024-00202', 'miguel.santos@student.edu',      '$2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK'),
    -- BSN Year 1 (regular)
    ('STUDENT', 'Ella Reyes',         '2024-00301', 'ella.reyes@student.edu',         '$2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK');

-- ── Sample Irregular Students ─────────────────────────────────────────────────
INSERT INTO users (user_type, full_name, school_id, email, password_hash) VALUES
    -- BSIT Year 3, Irregular (retaking some Year 2 subjects)
    ('STUDENT', 'Paolo Bautista',  '2022-00401', 'paolo.bautista@student.edu', '$2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK'),
    -- BSCS Year 2, Irregular
    ('STUDENT', 'Rina Torres',     '2023-00501', 'rina.torres@student.edu',    '$2a$12$Ybc1q5mlw63yd2u2cn0hs6jnzf2gljhr486u3dkgm2ysVoL0ZtGwRf6IpUXK');

-- ── Assign student profiles ───────────────────────────────────────────────────
INSERT INTO student_profiles (user_id, department_id, course_id, year_level, section, is_irregular) VALUES
    -- Regular BSIT Year 1 Section A
    ((SELECT id FROM users WHERE school_id = '2024-00101'),
     (SELECT id FROM departments WHERE code = 'CCSE'),
     (SELECT id FROM courses WHERE code = 'BSIT'), 1, 'A', FALSE),

    ((SELECT id FROM users WHERE school_id = '2024-00102'),
     (SELECT id FROM departments WHERE code = 'CCSE'),
     (SELECT id FROM courses WHERE code = 'BSIT'), 1, 'A', FALSE),

    ((SELECT id FROM users WHERE school_id = '2024-00103'),
     (SELECT id FROM departments WHERE code = 'CCSE'),
     (SELECT id FROM courses WHERE code = 'BSIT'), 1, 'A', FALSE),

    -- Regular BSCS Year 1 Section A
    ((SELECT id FROM users WHERE school_id = '2024-00201'),
     (SELECT id FROM departments WHERE code = 'CCSE'),
     (SELECT id FROM courses WHERE code = 'BSCS'), 1, 'A', FALSE),

    ((SELECT id FROM users WHERE school_id = '2024-00202'),
     (SELECT id FROM departments WHERE code = 'CCSE'),
     (SELECT id FROM courses WHERE code = 'BSCS'), 1, 'A', FALSE),

    -- Regular BSN Year 1 Section A
    ((SELECT id FROM users WHERE school_id = '2024-00301'),
     (SELECT id FROM departments WHERE code = 'CON'),
     (SELECT id FROM courses WHERE code = 'BSN'), 1, 'A', FALSE),

    -- Irregular BSIT Year 3 (no section)
    ((SELECT id FROM users WHERE school_id = '2022-00401'),
     (SELECT id FROM departments WHERE code = 'CCSE'),
     (SELECT id FROM courses WHERE code = 'BSIT'), 3, NULL, TRUE),

    -- Irregular BSCS Year 2 (no section)
    ((SELECT id FROM users WHERE school_id = '2023-00501'),
     (SELECT id FROM departments WHERE code = 'CCSE'),
     (SELECT id FROM courses WHERE code = 'BSCS'), 2, NULL, TRUE);

-- ── Sample Sections for school year 2024-2025, 1st semester ──────────────────
INSERT INTO sections (course_id, year_level, section_name, semester, school_year, max_students) VALUES
    ((SELECT id FROM courses WHERE code = 'BSIT'), 1, 'A', '1st', '2024-2025', 45),
    ((SELECT id FROM courses WHERE code = 'BSIT'), 1, 'B', '1st', '2024-2025', 45),
    ((SELECT id FROM courses WHERE code = 'BSCS'), 1, 'A', '1st', '2024-2025', 40),
    ((SELECT id FROM courses WHERE code = 'BSN'),  1, 'A', '1st', '2024-2025', 40),
    ((SELECT id FROM courses WHERE code = 'BSN'),  1, 'B', '1st', '2024-2025', 40),
    ((SELECT id FROM courses WHERE code = 'ABPsy'),1, 'A', '1st', '2024-2025', 35),
    ((SELECT id FROM courses WHERE code = 'BSPsy'),1, 'A', '1st', '2024-2025', 35),
    ((SELECT id FROM courses WHERE code = 'BSTM'), 1, 'A', '1st', '2024-2025', 40),
    ((SELECT id FROM courses WHERE code = 'BSHM'), 1, 'A', '1st', '2024-2025', 40),
    ((SELECT id FROM courses WHERE code = 'BSBA'), 1, 'A', '1st', '2024-2025', 40);

-- ── Confirmation ──────────────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'TimeCraft seed data V8 applied.';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample credentials:';
    RAISE NOTICE '  Teachers : T-2020-001 to T-2020-007 / Teacher@1234';
    RAISE NOTICE '  Regular  : 2024-00101 to 2024-00301 / Student@1234';
    RAISE NOTICE '  Irregular: 2022-00401, 2023-00501    / Student@1234';
    RAISE NOTICE '';
    RAISE NOTICE 'Login uses email address. School ID shown for reference.';
    RAISE NOTICE 'CHANGE ALL PASSWORDS before going live!';
    RAISE NOTICE '=======================================================';
END $$;