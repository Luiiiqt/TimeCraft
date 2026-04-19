-- ============================================================
-- V3: Campuses and Rooms
--
--  Two campuses only:
--    - Campus of Learning Innovation
--    - Campus of Health and Sciences
--
--  Room types:
--    - LECTURE
--    - LABORATORY
-- ============================================================

-- ── Campuses ──────────────────────────────────────────────────────────────────
CREATE TABLE campuses (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL UNIQUE,
    code        VARCHAR(20)     NOT NULL UNIQUE,
    address     TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE
);

-- ── Rooms ─────────────────────────────────────────────────────────────────────
CREATE TABLE rooms (
    id              BIGSERIAL       PRIMARY KEY,
    campus_id       BIGINT          NOT NULL,
    department_id   BIGINT,
    name            VARCHAR(100)    NOT NULL,
    room_number     VARCHAR(20)     UNIQUE,
    capacity        INT             NOT NULL CHECK (capacity > 0),
    room_type       VARCHAR(15)     NOT NULL CHECK (room_type IN ('LECTURE', 'LABORATORY')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rooms_campus
        FOREIGN KEY (campus_id) REFERENCES campuses (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rooms_department
        FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT,

    CONSTRAINT uq_rooms_name_campus
        UNIQUE (campus_id, name)
);

-- ── Seed campuses ─────────────────────────────────────────────────────────────
INSERT INTO campuses (name, code, address) VALUES
    ('Campus of Learning Innovation',   'CLI', 'Main Campus — Learning Innovation Building'),
    ('Campus of Health and Sciences',   'CHS', 'Health Sciences Campus');

-- ── Seed rooms — CCSE only (CLI) ─────────────────────────────────────────────
INSERT INTO rooms (campus_id, department_id, name, room_number, capacity, room_type) VALUES
    -- Computer Labs 301–304 (shared: ITCS + CPE)
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Computer Laboratory 301', '301', 30, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Computer Laboratory 302', '302', 30, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Computer Laboratory 303', '303', 30, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Computer Laboratory 304', '304', 30, 'LABORATORY'),

    -- CPE Hardware Lab 305
    ((SELECT id FROM campuses WHERE code = 'CLI'), (SELECT id FROM departments WHERE code = 'CPE'), 'Hardware Laboratory 305', '305', 30, 'LABORATORY'),

    -- ITCS/CPE Lecture Room 306
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 306', '306', 45, 'LECTURE'),

    -- General Lecture Rooms 401–408
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 401', '401', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 402', '402', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 403', '403', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 404', '404', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 405', '405', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 406', '406', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 407', '407', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'Lecture Room 408', '408', 45, 'LECTURE');

COMMENT ON TABLE  campuses            IS 'Physical campuses — Campus of Learning Innovation and Campus of Health and Sciences';
COMMENT ON TABLE  rooms               IS 'Schedulable rooms — must be LECTURE or LABORATORY';
COMMENT ON COLUMN rooms.room_type     IS 'LECTURE | LABORATORY — must match subject requirement';
COMMENT ON COLUMN rooms.campus_id     IS 'Health-related courses should prefer Campus of Health and Sciences';