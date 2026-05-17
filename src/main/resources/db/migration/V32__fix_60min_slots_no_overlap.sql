-- V32__fix_60min_slots_no_overlap.sql
--
-- Problem: 60-min slots at 08:00–09:00 visually overlap the 90-min 07:30–09:00 row.
-- Similarly 10:00–11:00 overlaps 09:00–10:30, etc.
--
-- Solution: Use ONLY start times that fall exactly at the END of a 90-min slot,
-- so 60-min slots occupy clean non-overlapping bands on the grid.
--
-- New 60-min slot grid (slots 8–14):
--   Slot  8 : 09:00 – 10:00   (starts at end of slot 1: 07:30–09:00) ← WAIT, overlaps slot 2
--
-- Better approach: use times BETWEEN 90-min slot boundaries that don't overlap any 90-min slot:
--   90-min slots occupy: 07:30–09:00, 09:00–10:30, 10:30–12:00, 12:00–13:30, 13:30–15:00, 15:00–16:30, 16:30–18:00
--   These cover the ENTIRE day with no gaps. There is NO time that doesn't overlap a 90-min slot.
--
-- CORRECT SOLUTION: 60-min slots must use the SAME start times as 90-min slots.
-- The visual overlap issue is a DISPLAY bug, not a scheduling bug.
-- The scheduler correctly avoids double-booking via isSectionFree time checks.
-- We need to fix the DISPLAY by using aligned start times, and fix the grid
-- to show 60-min and 90-min as sub-rows when they share a start time.
--
-- For now: align 60-min slots to 90-min slot START times so they display cleanly.
-- The section conflict check prevents actual double-booking.
-- ============================================================

-- ── 1. Nullify schedule references to old 60-min slots ───────────────────────
UPDATE schedules SET timeslot_id  = NULL
  WHERE timeslot_id  IN (SELECT id FROM timeslots WHERE slot_number BETWEEN 8 AND 14);
UPDATE schedules SET timeslot2_id = NULL
  WHERE timeslot2_id IN (SELECT id FROM timeslots WHERE slot_number BETWEEN 8 AND 14);

-- ── 2. Remove teacher_availability rows for old 60-min slots ─────────────────
DELETE FROM teacher_availability
  WHERE timeslot_id IN (SELECT id FROM timeslots WHERE slot_number BETWEEN 8 AND 14);

-- ── 3. Delete old 60-min slots ───────────────────────────────────────────────
DELETE FROM timeslots WHERE slot_number BETWEEN 8 AND 14;

-- ── 4. Insert 60-min slots aligned to 90-min start times ─────────────────────
-- Using SAME start times as 90-min slots. The grid will show them in the same
-- row band but the scheduler distinguishes them by duration_minutes.
-- We skip the last slot (16:30) since 16:30–18:00 is already 90-min only.
-- Slot mapping:
--   Slot  8 : 07:30 – 08:30  (inside slot 1)
--   Slot  9 : 09:00 – 10:00  (inside slot 2)
--   Slot 10 : 10:30 – 11:30  (inside slot 3)
--   Slot 11 : 12:00 – 13:00  (inside slot 4)
--   Slot 12 : 13:30 – 14:30  (inside slot 5)
--   Slot 13 : 15:00 – 16:00  (inside slot 6)
--   Slot 14 : 16:30 – 17:30  (inside slot 7)

INSERT INTO timeslots (day_of_week, slot_number, start_time, end_time, duration_minutes, label) VALUES

  -- ── MONDAY ──────────────────────────────────────────────────────────────────
  ('MONDAY',  8, '07:30', '08:30', 60, 'Monday 7:30 AM – 8:30 AM'),
  ('MONDAY',  9, '09:00', '10:00', 60, 'Monday 9:00 AM – 10:00 AM'),
  ('MONDAY', 10, '10:30', '11:30', 60, 'Monday 10:30 AM – 11:30 AM'),
  ('MONDAY', 11, '12:00', '13:00', 60, 'Monday 12:00 PM – 1:00 PM'),
  ('MONDAY', 12, '13:30', '14:30', 60, 'Monday 1:30 PM – 2:30 PM'),
  ('MONDAY', 13, '15:00', '16:00', 60, 'Monday 3:00 PM – 4:00 PM'),
  ('MONDAY', 14, '16:30', '17:30', 60, 'Monday 4:30 PM – 5:30 PM'),

  -- ── TUESDAY ─────────────────────────────────────────────────────────────────
  ('TUESDAY',  8, '07:30', '08:30', 60, 'Tuesday 7:30 AM – 8:30 AM'),
  ('TUESDAY',  9, '09:00', '10:00', 60, 'Tuesday 9:00 AM – 10:00 AM'),
  ('TUESDAY', 10, '10:30', '11:30', 60, 'Tuesday 10:30 AM – 11:30 AM'),
  ('TUESDAY', 11, '12:00', '13:00', 60, 'Tuesday 12:00 PM – 1:00 PM'),
  ('TUESDAY', 12, '13:30', '14:30', 60, 'Tuesday 1:30 PM – 2:30 PM'),
  ('TUESDAY', 13, '15:00', '16:00', 60, 'Tuesday 3:00 PM – 4:00 PM'),
  ('TUESDAY', 14, '16:30', '17:30', 60, 'Tuesday 4:30 PM – 5:30 PM'),

  -- ── WEDNESDAY ───────────────────────────────────────────────────────────────
  ('WEDNESDAY',  8, '07:30', '08:30', 60, 'Wednesday 7:30 AM – 8:30 AM'),
  ('WEDNESDAY',  9, '09:00', '10:00', 60, 'Wednesday 9:00 AM – 10:00 AM'),
  ('WEDNESDAY', 10, '10:30', '11:30', 60, 'Wednesday 10:30 AM – 11:30 AM'),
  ('WEDNESDAY', 11, '12:00', '13:00', 60, 'Wednesday 12:00 PM – 1:00 PM'),
  ('WEDNESDAY', 12, '13:30', '14:30', 60, 'Wednesday 1:30 PM – 2:30 PM'),
  ('WEDNESDAY', 13, '15:00', '16:00', 60, 'Wednesday 3:00 PM – 4:00 PM'),
  ('WEDNESDAY', 14, '16:30', '17:30', 60, 'Wednesday 4:30 PM – 5:30 PM'),

  -- ── THURSDAY ────────────────────────────────────────────────────────────────
  ('THURSDAY',  8, '07:30', '08:30', 60, 'Thursday 7:30 AM – 8:30 AM'),
  ('THURSDAY',  9, '09:00', '10:00', 60, 'Thursday 9:00 AM – 10:00 AM'),
  ('THURSDAY', 10, '10:30', '11:30', 60, 'Thursday 10:30 AM – 11:30 AM'),
  ('THURSDAY', 11, '12:00', '13:00', 60, 'Thursday 12:00 PM – 1:00 PM'),
  ('THURSDAY', 12, '13:30', '14:30', 60, 'Thursday 1:30 PM – 2:30 PM'),
  ('THURSDAY', 13, '15:00', '16:00', 60, 'Thursday 3:00 PM – 4:00 PM'),
  ('THURSDAY', 14, '16:30', '17:30', 60, 'Thursday 4:30 PM – 5:30 PM'),

  -- ── FRIDAY ──────────────────────────────────────────────────────────────────
  ('FRIDAY',  8, '07:30', '08:30', 60, 'Friday 7:30 AM – 8:30 AM'),
  ('FRIDAY',  9, '09:00', '10:00', 60, 'Friday 9:00 AM – 10:00 AM'),
  ('FRIDAY', 10, '10:30', '11:30', 60, 'Friday 10:30 AM – 11:30 AM'),
  ('FRIDAY', 11, '12:00', '13:00', 60, 'Friday 12:00 PM – 1:00 PM'),
  ('FRIDAY', 12, '13:30', '14:30', 60, 'Friday 1:30 PM – 2:30 PM'),
  ('FRIDAY', 13, '15:00', '16:00', 60, 'Friday 3:00 PM – 4:00 PM'),
  ('FRIDAY', 14, '16:30', '17:30', 60, 'Friday 4:30 PM – 5:30 PM'),

  -- ── SATURDAY ────────────────────────────────────────────────────────────────
  ('SATURDAY',  8, '07:30', '08:30', 60, 'Saturday 7:30 AM – 8:30 AM'),
  ('SATURDAY',  9, '09:00', '10:00', 60, 'Saturday 9:00 AM – 10:00 AM'),
  ('SATURDAY', 10, '10:30', '11:30', 60, 'Saturday 10:30 AM – 11:30 AM'),
  ('SATURDAY', 11, '12:00', '13:00', 60, 'Saturday 12:00 PM – 1:00 PM'),
  ('SATURDAY', 12, '13:30', '14:30', 60, 'Saturday 1:30 PM – 2:30 PM'),
  ('SATURDAY', 13, '15:00', '16:00', 60, 'Saturday 3:00 PM – 4:00 PM'),
  ('SATURDAY', 14, '16:30', '17:30', 60, 'Saturday 4:30 PM – 5:30 PM');