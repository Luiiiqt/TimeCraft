-- ============================================================
-- V7: Indexes and additional constraints
-- ============================================================

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_school_id      ON users (school_id);
CREATE INDEX idx_users_user_type      ON users (user_type);
CREATE INDEX idx_users_is_active      ON users (is_active);

-- ── student_profiles ──────────────────────────────────────────────────────────
CREATE INDEX idx_sp_department_id     ON student_profiles (department_id);
CREATE INDEX idx_sp_course_id         ON student_profiles (course_id);
CREATE INDEX idx_sp_year_level        ON student_profiles (year_level);
CREATE INDEX idx_sp_section           ON student_profiles (section);
CREATE INDEX idx_sp_is_irregular      ON student_profiles (is_irregular);

-- Partial index — fast lookup of all irregular students
CREATE INDEX idx_sp_irregular_only    ON student_profiles (user_id)
    WHERE is_irregular = TRUE;

-- ── teacher_profiles ──────────────────────────────────────────────────────────
CREATE INDEX idx_tp_department_id     ON teacher_profiles (department_id);

-- ── departments ───────────────────────────────────────────────────────────────
CREATE INDEX idx_departments_code     ON departments (code);
CREATE INDEX idx_departments_active   ON departments (is_active);

-- ── courses ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_courses_department   ON courses (department_id);
CREATE INDEX idx_courses_code         ON courses (code);
CREATE INDEX idx_courses_active       ON courses (is_active);

-- ── course_subjects ───────────────────────────────────────────────────────────
CREATE INDEX idx_cs_course_id         ON course_subjects (course_id);
CREATE INDEX idx_cs_subject_id        ON course_subjects (subject_id);
CREATE INDEX idx_cs_year_semester     ON course_subjects (year_level, semester);
CREATE INDEX idx_cs_shared            ON course_subjects (is_shared)
    WHERE is_shared = TRUE;   -- partial: only shared subjects

-- ── campuses ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_campuses_code        ON campuses (code);

-- ── rooms ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_rooms_campus_id      ON rooms (campus_id);
CREATE INDEX idx_rooms_room_type      ON rooms (room_type);
CREATE INDEX idx_rooms_capacity       ON rooms (capacity);
CREATE INDEX idx_rooms_active         ON rooms (is_active);

-- Composite: most common scheduling query — "find available lecture rooms on this campus"
CREATE INDEX idx_rooms_campus_type    ON rooms (campus_id, room_type, is_active);

-- ── subjects ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_subjects_code            ON subjects (code);
CREATE INDEX idx_subjects_department_id   ON subjects (department_id);
CREATE INDEX idx_subjects_type            ON subjects (subject_type);
CREATE INDEX idx_subjects_session_type    ON subjects (session_type);
CREATE INDEX idx_subjects_active          ON subjects (is_active);

-- ── timeslots ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_timeslots_day            ON timeslots (day_of_week);
CREATE INDEX idx_timeslots_slot_num       ON timeslots (slot_number);
CREATE INDEX idx_timeslots_day_slot       ON timeslots (day_of_week, slot_number);

-- ── teacher_availability ──────────────────────────────────────────────────────
CREATE INDEX idx_avail_teacher_id         ON teacher_availability (teacher_id);
-- Partial: only available slots (used by scheduling engine)
CREATE INDEX idx_avail_available_slots    ON teacher_availability (teacher_id, timeslot_id)
    WHERE available = TRUE;

-- ── sections ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_sections_course_id       ON sections (course_id);
CREATE INDEX idx_sections_term            ON sections (semester, school_year);
CREATE INDEX idx_sections_year_level      ON sections (year_level);
CREATE INDEX idx_sections_active          ON sections (is_active);

-- ── schedules ─────────────────────────────────────────────────────────────────
-- Most-used filter: all schedules for a semester/school year
CREATE INDEX idx_schedules_term           ON schedules (semester, school_year);

-- Teacher view: "show all my schedules this term"
CREATE INDEX idx_schedules_teacher_term   ON schedules (teacher_id, semester, school_year);

-- Subject view: used during conflict detection
CREATE INDEX idx_schedules_subject_term   ON schedules (subject_id, semester, school_year);

-- Room utilisation report
CREATE INDEX idx_schedules_room_term      ON schedules (room_id, semester, school_year);

-- Section view: "all classes for section BSIT-1A"
CREATE INDEX idx_schedules_section_id     ON schedules (section_id);

-- Campus-based filtering
CREATE INDEX idx_schedules_campus_id      ON schedules (campus_id);

-- Status filtering (e.g. all CONFLICTED or DRAFT entries)
CREATE INDEX idx_schedules_status         ON schedules (status);

-- Timeslot-based conflict detection (both session columns)
CREATE INDEX idx_schedules_ts1            ON schedules (timeslot_id);
CREATE INDEX idx_schedules_ts2            ON schedules (timeslot2_id);

-- ── student_schedules ─────────────────────────────────────────────────────────
CREATE INDEX idx_ss_student_id            ON student_schedules (student_id);
CREATE INDEX idx_ss_schedule_id           ON student_schedules (schedule_id);
-- Partial: only irregular assignments
CREATE INDEX idx_ss_irregular_only        ON student_schedules (student_id)
    WHERE assignment_type = 'IRREGULAR';

-- ── conflict_log ──────────────────────────────────────────────────────────────
CREATE INDEX idx_conflict_schedule_id     ON conflict_log (schedule_id);
CREATE INDEX idx_conflict_type            ON conflict_log (conflict_type);
-- Partial: only unresolved — the most frequently queried subset
CREATE INDEX idx_conflict_unresolved      ON conflict_log (detected_at)
    WHERE resolved = FALSE;

-- ── Campus affinity rule (application-enforced, documented here) ──────────────
-- Health-science courses should be scheduled at Campus of Health and Sciences.
-- This cannot be expressed as a pure SQL CHECK without a subquery,
-- so it is enforced in the SchedulingEngine service via a validation step.
-- The campus_id column on schedules records the actual assignment for auditing.

COMMENT ON INDEX idx_sp_irregular_only   IS 'Fast path for irregular student lookups used during conflict detection';
COMMENT ON INDEX idx_avail_available_slots IS 'Partial index — only rows where available=TRUE; used by scheduling engine';
COMMENT ON INDEX idx_ss_irregular_only   IS 'Partial index — only IRREGULAR assignments; used when building irregular student schedules';
COMMENT ON INDEX idx_conflict_unresolved IS 'Partial index — only unresolved conflicts; used on admin dashboard';