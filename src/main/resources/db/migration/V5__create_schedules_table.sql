-- ============================================================
-- V5: Sections, Schedules, Student Schedules, Conflict Log
--     + all indexes
-- ============================================================

-- ── Sections ─────────────────────────────────────────────────────────────────                                                                                    
CREATE TABLE sections (
    id           BIGSERIAL    PRIMARY KEY,
    course_id    BIGINT       NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    year_level   SMALLINT     NOT NULL,
    section_name VARCHAR(10)  NOT NULL,
    semester     VARCHAR(10)  NOT NULL,
    school_year  VARCHAR(10)  NOT NULL,
    max_students SMALLINT     NOT NULL DEFAULT 45,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_section_course_year_name_term
        UNIQUE (course_id, year_level, section_name, semester, school_year),
    CONSTRAINT sections_semester_check
        CHECK (semester IN ('1st','2nd','Summer')),
    CONSTRAINT sections_year_level_check
        CHECK (year_level >= 1 AND year_level <= 5)
);          

-- ── Schedules ─────────────────────────────────────────────────────────────────
CREATE TABLE schedules (
    id           BIGSERIAL    PRIMARY KEY,
    subject_id   BIGINT       NOT NULL REFERENCES subjects(id)   ON DELETE RESTRICT,
    room_id      BIGINT                REFERENCES rooms(id)      ON DELETE RESTRICT,
    teacher_id   BIGINT                REFERENCES users(id)      ON DELETE RESTRICT,
    timeslot_id  BIGINT                REFERENCES timeslots(id)  ON DELETE RESTRICT,
    timeslot2_id BIGINT                REFERENCES timeslots(id)  ON DELETE RESTRICT,
    section_id   BIGINT                REFERENCES sections(id)   ON DELETE SET NULL,
    campus_id    BIGINT                REFERENCES campuses(id)   ON DELETE RESTRICT,
    semester     VARCHAR(20)  NOT NULL CHECK (semester IN ('1st','2nd','Summer')),
    school_year  VARCHAR(10)  NOT NULL,
    status       VARCHAR(15)  NOT NULL DEFAULT 'DRAFT'
                              CHECK (status IN ('DRAFT','PUBLISHED','CONFLICTED')),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Student schedules ─────────────────────────────────────────────────────────
CREATE TABLE student_schedules (
    id              BIGSERIAL   PRIMARY KEY,
    student_id      BIGINT      NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    schedule_id     BIGINT      NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    assignment_type VARCHAR(15) NOT NULL DEFAULT 'REGULAR'
                                CHECK (assignment_type IN ('REGULAR','IRREGULAR')),
    assigned_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_schedule UNIQUE (student_id, schedule_id)
);

-- ── Conflict log ──────────────────────────────────────────────────────────────
CREATE TABLE conflict_log (
    id            BIGSERIAL   PRIMARY KEY,
    schedule_id   BIGINT      NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    conflict_type VARCHAR(30) NOT NULL,
    description   TEXT,
    detected_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    resolved      BOOLEAN     NOT NULL DEFAULT FALSE,
    resolved_at   TIMESTAMP
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_users_school_id      ON users (school_id);
CREATE INDEX idx_users_user_type      ON users (user_type);
CREATE INDEX idx_users_is_active      ON users (is_active);

CREATE INDEX idx_sp_department_id     ON student_profiles (department_id);
CREATE INDEX idx_sp_course_id         ON student_profiles (course_id);
CREATE INDEX idx_sp_year_level        ON student_profiles (year_level);
CREATE INDEX idx_sp_section           ON student_profiles (section);
CREATE INDEX idx_sp_is_irregular      ON student_profiles (is_irregular);
CREATE INDEX idx_sp_irregular_only    ON student_profiles (user_id) WHERE is_irregular = TRUE;

CREATE INDEX idx_tp_department_id     ON teacher_profiles (department_id);

CREATE INDEX idx_departments_code     ON departments (code);
CREATE INDEX idx_departments_active   ON departments (is_active);

CREATE INDEX idx_courses_department   ON courses (department_id);
CREATE INDEX idx_courses_code         ON courses (code);
CREATE INDEX idx_courses_active       ON courses (is_active);

CREATE INDEX idx_cs_course_id         ON course_subjects (course_id);
CREATE INDEX idx_cs_subject_id        ON course_subjects (subject_id);
CREATE INDEX idx_cs_year_semester     ON course_subjects (year_level, semester);
CREATE INDEX idx_cs_shared            ON course_subjects (is_shared) WHERE is_shared = TRUE;

CREATE INDEX idx_campuses_code        ON campuses (code);

CREATE INDEX idx_rooms_campus_id      ON rooms (campus_id);
CREATE INDEX idx_rooms_department_id  ON rooms (department_id);
CREATE INDEX idx_rooms_room_type      ON rooms (room_type);
CREATE INDEX idx_rooms_capacity       ON rooms (capacity);
CREATE INDEX idx_rooms_active         ON rooms (is_active);
CREATE INDEX idx_rooms_campus_type    ON rooms (campus_id, room_type, is_active);

CREATE INDEX idx_subjects_code            ON subjects (code);
CREATE INDEX idx_subjects_department_id   ON subjects (department_id);
CREATE INDEX idx_subjects_session_type    ON subjects (session_type);
CREATE INDEX idx_subjects_active          ON subjects (is_active);

CREATE INDEX idx_timeslots_day            ON timeslots (day_of_week);
CREATE INDEX idx_timeslots_slot_num       ON timeslots (slot_number);
CREATE INDEX idx_timeslots_day_slot       ON timeslots (day_of_week, slot_number);

CREATE INDEX idx_avail_teacher_id         ON teacher_availability (teacher_id);
CREATE INDEX idx_avail_available_slots    ON teacher_availability (teacher_id, timeslot_id) WHERE available = TRUE;

CREATE INDEX idx_sections_course_id       ON sections (course_id);
CREATE INDEX idx_sections_term            ON sections (semester, school_year);
CREATE INDEX idx_sections_year_level      ON sections (year_level);
CREATE INDEX idx_sections_active          ON sections (is_active);

CREATE INDEX idx_schedules_term           ON schedules (semester, school_year);
CREATE INDEX idx_schedules_teacher_term   ON schedules (teacher_id, semester, school_year);
CREATE INDEX idx_schedules_subject_term   ON schedules (subject_id, semester, school_year);
CREATE INDEX idx_schedules_room_term      ON schedules (room_id, semester, school_year);
CREATE INDEX idx_schedules_section_id     ON schedules (section_id);
CREATE INDEX idx_schedules_campus_id      ON schedules (campus_id);
CREATE INDEX idx_schedules_status         ON schedules (status);
CREATE INDEX idx_schedules_ts1            ON schedules (timeslot_id);
CREATE INDEX idx_schedules_ts2            ON schedules (timeslot2_id);

CREATE INDEX idx_ss_student_id            ON student_schedules (student_id);
CREATE INDEX idx_ss_schedule_id           ON student_schedules (schedule_id);
CREATE INDEX idx_ss_irregular_only        ON student_schedules (student_id) WHERE assignment_type = 'IRREGULAR';

CREATE INDEX idx_conflict_schedule_id     ON conflict_log (schedule_id);
CREATE INDEX idx_conflict_type            ON conflict_log (conflict_type);
CREATE INDEX idx_conflict_unresolved      ON conflict_log (detected_at) WHERE resolved = FALSE;