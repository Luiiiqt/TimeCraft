-- ============================================================
-- V16: Remove all dummy seed data
--
--  Keeps: admin user, program head users/profiles,
--         departments, courses, campuses, timeslots
--  Removes: teachers, students, subjects, course_subjects,
--            rooms, sections
-- ============================================================

-- ── Remove teacher dummy data ─────────────────────────────────────────────────

DELETE FROM teacher_availability WHERE teacher_id IN (
    SELECT id FROM users WHERE school_id IN (
        'T-2020-001','T-2020-002','T-2020-003',
        'T-2020-004','T-2020-005','T-2020-006','T-2020-007'
    )
);

DELETE FROM teacher_subject_preferences WHERE teacher_id IN (
    SELECT id FROM users WHERE school_id IN (
        'T-2020-001','T-2020-002','T-2020-003',
        'T-2020-004','T-2020-005','T-2020-006','T-2020-007'
    )
);

DELETE FROM teacher_profiles WHERE user_id IN (
    SELECT id FROM users WHERE school_id IN (
        'T-2020-001','T-2020-002','T-2020-003',
        'T-2020-004','T-2020-005','T-2020-006','T-2020-007'
    )
);

DELETE FROM users WHERE school_id IN (
    'T-2020-001','T-2020-002','T-2020-003',
    'T-2020-004','T-2020-005','T-2020-006','T-2020-007'
);

-- ── Remove student dummy data ─────────────────────────────────────────────────

DELETE FROM student_schedules WHERE student_id IN (
    SELECT id FROM users WHERE school_id IN (
        '2024-00101','2024-00102','2024-00103',
        '2024-00201','2024-00202','2024-00301',
        '2022-00401','2023-00501'
    )
);

DELETE FROM student_checklists WHERE student_id IN (
    SELECT id FROM users WHERE school_id IN (
        '2024-00101','2024-00102','2024-00103',
        '2024-00201','2024-00202','2024-00301',
        '2022-00401','2023-00501'
    )
);

DELETE FROM student_profiles WHERE user_id IN (
    SELECT id FROM users WHERE school_id IN (
        '2024-00101','2024-00102','2024-00103',
        '2024-00201','2024-00202','2024-00301',
        '2022-00401','2023-00501'
    )
);

DELETE FROM users WHERE school_id IN (
    '2024-00101','2024-00102','2024-00103',
    '2024-00201','2024-00202','2024-00301',
    '2022-00401','2023-00501'
);

-- ── Remove sections, schedules, assignments (order matters for FKs) ───────────

DELETE FROM merged_sections;
DELETE FROM subject_assignments;
DELETE FROM schedules;
DELETE FROM sections;
DELETE FROM section_config;

-- ── Remove subjects and curriculum ───────────────────────────────────────────

DELETE FROM teacher_subject_preferences;
DELETE FROM course_subjects;
DELETE FROM subjects;

-- ── Remove rooms ─────────────────────────────────────────────────────────────

DELETE FROM rooms;

-- ── Confirmation ─────────────────────────────────────────────────────────────

DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'V16: Dummy seed data removed.';
    RAISE NOTICE '';
    RAISE NOTICE 'Kept:';
    RAISE NOTICE '  admin@timecraft.edu        / Admin@1234';
    RAISE NOTICE '  All program head accounts  / programhead123';
    RAISE NOTICE '  Departments, Courses, Campuses, Timeslots';
    RAISE NOTICE '';
    RAISE NOTICE 'Cleared:';
    RAISE NOTICE '  All teachers, students, subjects,';
    RAISE NOTICE '  rooms, sections, schedules, section_config';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  Admin     -> register teachers and rooms';
    RAISE NOTICE '  PH        -> input subjects per course';
    RAISE NOTICE '=======================================================';
END $$;