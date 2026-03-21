-- ============================================================
-- V6: Schedules, Block Sections, Student-Schedule Enrollment,
--     and Conflict Log
--
--  sections        : named class blocks (e.g. BSIT-1A, BSIT-1B)
--                    used for regular students
--  schedules       : one row per subject × timeslot × room × teacher
--                    assignment for a given semester/year
--  student_schedules: maps individual students to schedule entries
--                    (regular students inherit all section schedules;
--                     irregular students are mapped one-by-one)
--  conflict_log    : audit trail of detected scheduling conflicts
-- ============================================================

-- ── Block sections ────────────────────────────────────────────────────────────
CREATE TABLE sections (
    id              BIGSERIAL       PRIMARY KEY,
    course_id       BIGINT          NOT NULL,
    year_level      SMALLINT        NOT NULL CHECK (year_level BETWEEN 1 AND 5),
    section_name    VARCHAR(10)     NOT NULL,   -- e.g. A, B, C
    semester        VARCHAR(10)     NOT NULL CHECK (semester IN ('1st', '2nd', 'Summer')),
    school_year     VARCHAR(10)     NOT NULL,   -- e.g. 2024-2025
    max_students    SMALLINT        NOT NULL DEFAULT 45,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_sections_course
        FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE RESTRICT,

    CONSTRAINT uq_section_course_year_name_term
        UNIQUE (course_id, year_level, section_name, semester, school_year)
);

-- ── Schedules (core timetable) ────────────────────────────────────────────────
CREATE TABLE schedules (
    id              BIGSERIAL       PRIMARY KEY,
    subject_id      BIGINT          NOT NULL,
    room_id         BIGINT          NOT NULL,
    teacher_id      BIGINT          NOT NULL,
    timeslot_id     BIGINT          NOT NULL,   -- first of the two weekly sessions
    timeslot2_id    BIGINT          NOT NULL,   -- second weekly session (different day)
    section_id      BIGINT,                     -- NULL = not yet assigned to a section
    semester        VARCHAR(10)     NOT NULL CHECK (semester IN ('1st', '2nd', 'Summer')),
    school_year     VARCHAR(10)     NOT NULL,   -- e.g. 2024-2025
    campus_id       BIGINT          NOT NULL,
    status          VARCHAR(15)     NOT NULL DEFAULT 'DRAFT'
                                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'CONFLICTED')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    -- ── Hard constraint: no room double-booking per timeslot ─────────────────
    CONSTRAINT uq_schedules_room_ts1
        UNIQUE (room_id, timeslot_id, semester, school_year),
    CONSTRAINT uq_schedules_room_ts2
        UNIQUE (room_id, timeslot2_id, semester, school_year),

    -- ── Hard constraint: no teacher double-booking per timeslot ──────────────
    CONSTRAINT uq_schedules_teacher_ts1
        UNIQUE (teacher_id, timeslot_id, semester, school_year),
    CONSTRAINT uq_schedules_teacher_ts2
        UNIQUE (teacher_id, timeslot2_id, semester, school_year),

    CONSTRAINT fk_schedules_subject
        FOREIGN KEY (subject_id)  REFERENCES subjects (id)   ON DELETE RESTRICT,
    CONSTRAINT fk_schedules_room
        FOREIGN KEY (room_id)     REFERENCES rooms (id)       ON DELETE RESTRICT,
    CONSTRAINT fk_schedules_teacher
        FOREIGN KEY (teacher_id)  REFERENCES users (id)       ON DELETE RESTRICT,
    CONSTRAINT fk_schedules_timeslot
        FOREIGN KEY (timeslot_id) REFERENCES timeslots (id)   ON DELETE RESTRICT,
    CONSTRAINT fk_schedules_timeslot2
        FOREIGN KEY (timeslot2_id) REFERENCES timeslots (id)  ON DELETE RESTRICT,
    CONSTRAINT fk_schedules_section
        FOREIGN KEY (section_id)  REFERENCES sections (id)    ON DELETE SET NULL,
    CONSTRAINT fk_schedules_campus
        FOREIGN KEY (campus_id)   REFERENCES campuses (id)    ON DELETE RESTRICT,

    -- Two sessions must be on different days
    CONSTRAINT chk_different_days
        CHECK (timeslot_id <> timeslot2_id)
);

-- ── Student ↔ Schedule mapping ────────────────────────────────────────────────
-- Regular students: automatically inherit all schedules of their section
-- Irregular students: assigned individually to specific schedule rows
CREATE TABLE student_schedules (
    id              BIGSERIAL   PRIMARY KEY,
    student_id      BIGINT      NOT NULL,
    schedule_id     BIGINT      NOT NULL,
    assignment_type VARCHAR(10) NOT NULL CHECK (assignment_type IN ('REGULAR', 'IRREGULAR')),
    enrolled_at     TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ss_student
        FOREIGN KEY (student_id)  REFERENCES users (id)      ON DELETE CASCADE,
    CONSTRAINT fk_ss_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedules (id)  ON DELETE CASCADE,

    CONSTRAINT uq_student_schedule
        UNIQUE (student_id, schedule_id)
);

-- ── Conflict log ──────────────────────────────────────────────────────────────
CREATE TABLE conflict_log (
    id              BIGSERIAL       PRIMARY KEY,
    schedule_id     BIGINT,
    conflict_type   VARCHAR(30)     NOT NULL CHECK (conflict_type IN (
                                        'TEACHER_DOUBLE_BOOKED',
                                        'ROOM_DOUBLE_BOOKED',
                                        'STUDENT_TIME_CONFLICT',
                                        'TEACHER_UNAVAILABLE',
                                        'WRONG_ROOM_TYPE',
                                        'WRONG_CAMPUS'
                                    )),
    description     TEXT,
    resolved        BOOLEAN         NOT NULL DEFAULT FALSE,
    detected_at     TIMESTAMP       NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMP,

    CONSTRAINT fk_conflict_schedule
        FOREIGN KEY (schedule_id) REFERENCES schedules (id) ON DELETE SET NULL
);

COMMENT ON TABLE  sections                      IS 'Named block sections e.g. BSIT-1A — groups regular students together';
COMMENT ON TABLE  schedules                     IS 'Core timetable — stores both weekly timeslots (timeslot_id + timeslot2_id)';
COMMENT ON COLUMN schedules.timeslot_id         IS 'First weekly session timeslot';
COMMENT ON COLUMN schedules.timeslot2_id        IS 'Second weekly session timeslot — must be a different day';
COMMENT ON COLUMN schedules.section_id          IS 'NULL until a section is assigned; can be NULL for open/irregular schedules';
COMMENT ON TABLE  student_schedules             IS 'Maps students to schedule entries; irregular students appear with assignment_type=IRREGULAR';
COMMENT ON COLUMN student_schedules.assignment_type IS 'REGULAR = block section member; IRREGULAR = individually assigned';
COMMENT ON TABLE  conflict_log                  IS 'Audit log of all conflicts detected during scheduling';
COMMENT ON COLUMN conflict_log.conflict_type    IS 'TEACHER_DOUBLE_BOOKED | ROOM_DOUBLE_BOOKED | STUDENT_TIME_CONFLICT | TEACHER_UNAVAILABLE | WRONG_ROOM_TYPE | WRONG_CAMPUS';