-- V31__fix_60min_timeslots.sql
-- Deletes the old 60-min slots (slots 8–14) that had colliding start times
-- with 90-min slots, and re-inserts them with offset start times.
--
-- 90-min slot start times (NEVER use these for 60-min slots):
--   07:30, 09:00, 10:30, 12:00, 13:30, 15:00, 16:30
--
-- New 60-min slot start times (all offset, no collisions):
--   Slot  8 : 08:00 – 09:00
--   Slot  9 : 10:00 – 11:00
--   Slot 10 : 11:30 – 12:30
--   Slot 11 : 13:00 – 14:00
--   Slot 12 : 14:30 – 15:30
--   Slot 13 : 15:30 – 16:30
--   Slot 14 : 17:00 – 18:00
-- ============================================================

-- ── 1. Remove any existing schedules referencing old 60-min timeslots ────────
--    (avoids FK constraint violations on delete)
UPDATE schedules SET timeslot_id  = NULL WHERE timeslot_id  IN (SELECT id FROM timeslots WHERE slot_number BETWEEN 8 AND 14);
UPDATE schedules SET timeslot2_id = NULL WHERE timeslot2_id IN (SELECT id FROM timeslots WHERE slot_number BETWEEN 8 AND 14);

-- ── 2. Remove teacher_availability rows referencing old 60-min timeslots ─────
DELETE FROM teacher_availability WHERE timeslot_id IN (SELECT id FROM timeslots WHERE slot_number BETWEEN 8 AND 14);

-- ── 3. Delete old 60-min timeslot rows ───────────────────────────────────────
DELETE FROM timeslots WHERE slot_number BETWEEN 8 AND 14;

-- ── 4. Insert corrected 60-min slots with offset start times ─────────────────

INSERT INTO timeslots (day_of_week, slot_number, start_time, end_time, duration_minutes, label) VALUES

  -- ── MONDAY ──────────────────────────────────────────────────────────────────
  ('MONDAY',  8, '08:00', '09:00', 60, 'Monday 8:00 AM – 9:00 AM'),
  ('MONDAY',  9, '10:00', '11:00', 60, 'Monday 10:00 AM – 11:00 AM'),
  ('MONDAY', 10, '11:30', '12:30', 60, 'Monday 11:30 AM – 12:30 PM'),
  ('MONDAY', 11, '13:00', '14:00', 60, 'Monday 1:00 PM – 2:00 PM'),
  ('MONDAY', 12, '14:30', '15:30', 60, 'Monday 2:30 PM – 3:30 PM'),
  ('MONDAY', 13, '15:30', '16:30', 60, 'Monday 3:30 PM – 4:30 PM'),
  ('MONDAY', 14, '17:00', '18:00', 60, 'Monday 5:00 PM – 6:00 PM'),

  -- ── TUESDAY ─────────────────────────────────────────────────────────────────
  ('TUESDAY',  8, '08:00', '09:00', 60, 'Tuesday 8:00 AM – 9:00 AM'),
  ('TUESDAY',  9, '10:00', '11:00', 60, 'Tuesday 10:00 AM – 11:00 AM'),
  ('TUESDAY', 10, '11:30', '12:30', 60, 'Tuesday 11:30 AM – 12:30 PM'),
  ('TUESDAY', 11, '13:00', '14:00', 60, 'Tuesday 1:00 PM – 2:00 PM'),
  ('TUESDAY', 12, '14:30', '15:30', 60, 'Tuesday 2:30 PM – 3:30 PM'),
  ('TUESDAY', 13, '15:30', '16:30', 60, 'Tuesday 3:30 PM – 4:30 PM'),
  ('TUESDAY', 14, '17:00', '18:00', 60, 'Tuesday 5:00 PM – 6:00 PM'),

  -- ── WEDNESDAY ───────────────────────────────────────────────────────────────
  ('WEDNESDAY',  8, '08:00', '09:00', 60, 'Wednesday 8:00 AM – 9:00 AM'),
  ('WEDNESDAY',  9, '10:00', '11:00', 60, 'Wednesday 10:00 AM – 11:00 AM'),
  ('WEDNESDAY', 10, '11:30', '12:30', 60, 'Wednesday 11:30 AM – 12:30 PM'),
  ('WEDNESDAY', 11, '13:00', '14:00', 60, 'Wednesday 1:00 PM – 2:00 PM'),
  ('WEDNESDAY', 12, '14:30', '15:30', 60, 'Wednesday 2:30 PM – 3:30 PM'),
  ('WEDNESDAY', 13, '15:30', '16:30', 60, 'Wednesday 3:30 PM – 4:30 PM'),
  ('WEDNESDAY', 14, '17:00', '18:00', 60, 'Wednesday 5:00 PM – 6:00 PM'),

  -- ── THURSDAY ────────────────────────────────────────────────────────────────
  ('THURSDAY',  8, '08:00', '09:00', 60, 'Thursday 8:00 AM – 9:00 AM'),
  ('THURSDAY',  9, '10:00', '11:00', 60, 'Thursday 10:00 AM – 11:00 AM'),
  ('THURSDAY', 10, '11:30', '12:30', 60, 'Thursday 11:30 AM – 12:30 PM'),
  ('THURSDAY', 11, '13:00', '14:00', 60, 'Thursday 1:00 PM – 2:00 PM'),
  ('THURSDAY', 12, '14:30', '15:30', 60, 'Thursday 2:30 PM – 3:30 PM'),
  ('THURSDAY', 13, '15:30', '16:30', 60, 'Thursday 3:30 PM – 4:30 PM'),
  ('THURSDAY', 14, '17:00', '18:00', 60, 'Thursday 5:00 PM – 6:00 PM'),

  -- ── FRIDAY ──────────────────────────────────────────────────────────────────
  ('FRIDAY',  8, '08:00', '09:00', 60, 'Friday 8:00 AM – 9:00 AM'),
  ('FRIDAY',  9, '10:00', '11:00', 60, 'Friday 10:00 AM – 11:00 AM'),
  ('FRIDAY', 10, '11:30', '12:30', 60, 'Friday 11:30 AM – 12:30 PM'),
  ('FRIDAY', 11, '13:00', '14:00', 60, 'Friday 1:00 PM – 2:00 PM'),
  ('FRIDAY', 12, '14:30', '15:30', 60, 'Friday 2:30 PM – 3:30 PM'),
  ('FRIDAY', 13, '15:30', '16:30', 60, 'Friday 3:30 PM – 4:30 PM'),
  ('FRIDAY', 14, '17:00', '18:00', 60, 'Friday 5:00 PM – 6:00 PM'),

  -- ── SATURDAY ────────────────────────────────────────────────────────────────
  ('SATURDAY',  8, '08:00', '09:00', 60, 'Saturday 8:00 AM – 9:00 AM'),
  ('SATURDAY',  9, '10:00', '11:00', 60, 'Saturday 10:00 AM – 11:00 AM'),
  ('SATURDAY', 10, '11:30', '12:30', 60, 'Saturday 11:30 AM – 12:30 PM'),
  ('SATURDAY', 11, '13:00', '14:00', 60, 'Saturday 1:00 PM – 2:00 PM'),
  ('SATURDAY', 12, '14:30', '15:30', 60, 'Saturday 2:30 PM – 3:30 PM'),
  ('SATURDAY', 13, '15:30', '16:30', 60, 'Saturday 3:30 PM – 4:30 PM'),
  ('SATURDAY', 14, '17:00', '18:00', 60, 'Saturday 5:00 PM – 6:00 PM');