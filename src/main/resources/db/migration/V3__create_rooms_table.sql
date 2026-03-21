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
    id          BIGSERIAL       PRIMARY KEY,
    campus_id   BIGINT          NOT NULL,
    name        VARCHAR(100)    NOT NULL,
    room_number VARCHAR(20),
    capacity    INT             NOT NULL CHECK (capacity > 0),
    room_type   VARCHAR(15)     NOT NULL CHECK (room_type IN ('LECTURE', 'LABORATORY')),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_rooms_campus
        FOREIGN KEY (campus_id) REFERENCES campuses (id) ON DELETE RESTRICT,

    -- Room name must be unique within a campus
    CONSTRAINT uq_rooms_name_campus
        UNIQUE (campus_id, name)
);

-- ── Seed campuses ─────────────────────────────────────────────────────────────
INSERT INTO campuses (name, code, address) VALUES
    ('Campus of Learning Innovation',   'CLI', 'Main Campus — Learning Innovation Building'),
    ('Campus of Health and Sciences',   'CHS', 'Health Sciences Campus');

-- ── Seed rooms — Campus of Learning Innovation ────────────────────────────────
INSERT INTO rooms (campus_id, name, room_number, capacity, room_type) VALUES
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Lecture Room 101',  '101', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Lecture Room 102',  '102', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Lecture Room 103',  '103', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Lecture Room 201',  '201', 50, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Lecture Room 202',  '202', 50, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Lecture Room 203',  '203', 50, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Computer Lab 1',    'CL1', 40, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Computer Lab 2',    'CL2', 40, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Computer Lab 3',    'CL3', 35, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CLI'), 'LI Engineering Lab 1', 'EL1', 35, 'LABORATORY');

-- ── Seed rooms — Campus of Health and Sciences ────────────────────────────────
INSERT INTO rooms (campus_id, name, room_number, capacity, room_type) VALUES
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Lecture Room 101',  '101', 50, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Lecture Room 102',  '102', 50, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Lecture Room 103',  '103', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Lecture Room 201',  '201', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Lecture Room 202',  '202', 45, 'LECTURE'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Nursing Lab 1',     'NL1', 30, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Nursing Lab 2',     'NL2', 30, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Medical Lab 1',     'ML1', 35, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Medical Lab 2',     'ML2', 35, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS Pharmacy Lab',      'PL1', 30, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS RT Lab',            'RL1', 25, 'LABORATORY'),
    ((SELECT id FROM campuses WHERE code = 'CHS'), 'HS PT Lab',            'PTL', 25, 'LABORATORY');

COMMENT ON TABLE  campuses            IS 'Physical campuses — Campus of Learning Innovation and Campus of Health and Sciences';
COMMENT ON TABLE  rooms               IS 'Schedulable rooms — must be LECTURE or LABORATORY';
COMMENT ON COLUMN rooms.room_type     IS 'LECTURE | LABORATORY — must match subject requirement';
COMMENT ON COLUMN rooms.campus_id     IS 'Health-related courses should prefer Campus of Health and Sciences';