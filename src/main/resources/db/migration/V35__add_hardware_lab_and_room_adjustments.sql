-- V35__add_hardware_lab_and_room_adjustments.sql
-- Remove rooms 401–403, add Room 307 (CS Lecture), add hardware_labs table

-- Remove online-class references (set is_online = false if column exists)
UPDATE schedules SET is_online = FALSE WHERE is_online = TRUE;

-- Deactivate rooms 401–403
UPDATE rooms SET is_active = FALSE WHERE room_number IN ('401', '402', '403');

-- Add Room 307 if not exists
INSERT INTO rooms (campus_id, department_id, name, room_number, capacity, room_type)
SELECT (SELECT id FROM campuses WHERE code = 'CLI'), NULL, 'CS Lecture Room 307', '307', 10, 'LECTURE'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = '307');

-- Hardware labs table for CPE
CREATE TABLE IF NOT EXISTS hardware_labs (
    id          BIGSERIAL   PRIMARY KEY,
    room_id     BIGINT      NOT NULL UNIQUE,
    description VARCHAR(200),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_hardware_labs_room
        FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE CASCADE
);

-- Seed Room 305 as hardware lab
INSERT INTO hardware_labs (room_id, description)
SELECT id, 'CPE Hardware Laboratory'
FROM rooms WHERE room_number = '305'
ON CONFLICT DO NOTHING;