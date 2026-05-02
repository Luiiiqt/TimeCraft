-- V26__add_duration_to_timeslots.sql

ALTER TABLE timeslots ADD COLUMN IF NOT EXISTS duration_minutes SMALLINT NOT NULL DEFAULT 90;

-- Widen slot_number constraint to allow 60-min slots (8–14)
ALTER TABLE timeslots DROP CONSTRAINT IF EXISTS timeslots_slot_number_check;
ALTER TABLE timeslots ADD CONSTRAINT timeslots_slot_number_check
    CHECK (slot_number BETWEEN 1 AND 14);

-- 60-min lecture slots for hasLab MAJOR subjects
INSERT INTO timeslots (day_of_week, slot_number, start_time, end_time, duration_minutes, label) VALUES
  ('MONDAY',     8, '07:30', '08:30', 60, 'Monday 7:30 AM – 8:30 AM'),
  ('MONDAY',     9, '09:00', '10:00', 60, 'Monday 9:00 AM – 10:00 AM'),
  ('MONDAY',    10, '10:30', '11:30', 60, 'Monday 10:30 AM – 11:30 AM'),
  ('MONDAY',    11, '12:00', '13:00', 60, 'Monday 12:00 PM – 1:00 PM'),
  ('MONDAY',    12, '13:30', '14:30', 60, 'Monday 1:30 PM – 2:30 PM'),
  ('MONDAY',    13, '15:00', '16:00', 60, 'Monday 3:00 PM – 4:00 PM'),
  ('MONDAY',    14, '16:30', '17:30', 60, 'Monday 4:30 PM – 5:30 PM'),

  ('TUESDAY',    8, '07:30', '08:30', 60, 'Tuesday 7:30 AM – 8:30 AM'),
  ('TUESDAY',    9, '09:00', '10:00', 60, 'Tuesday 9:00 AM – 10:00 AM'),
  ('TUESDAY',   10, '10:30', '11:30', 60, 'Tuesday 10:30 AM – 11:30 AM'),
  ('TUESDAY',   11, '12:00', '13:00', 60, 'Tuesday 12:00 PM – 1:00 PM'),
  ('TUESDAY',   12, '13:30', '14:30', 60, 'Tuesday 1:30 PM – 2:30 PM'),
  ('TUESDAY',   13, '15:00', '16:00', 60, 'Tuesday 3:00 PM – 4:00 PM'),
  ('TUESDAY',   14, '16:30', '17:30', 60, 'Tuesday 4:30 PM – 5:30 PM'),

  ('WEDNESDAY',  8, '07:30', '08:30', 60, 'Wednesday 7:30 AM – 8:30 AM'),
  ('WEDNESDAY',  9, '09:00', '10:00', 60, 'Wednesday 9:00 AM – 10:00 AM'),
  ('WEDNESDAY', 10, '10:30', '11:30', 60, 'Wednesday 10:30 AM – 11:30 AM'),
  ('WEDNESDAY', 11, '12:00', '13:00', 60, 'Wednesday 12:00 PM – 1:00 PM'),
  ('WEDNESDAY', 12, '13:30', '14:30', 60, 'Wednesday 1:30 PM – 2:30 PM'),
  ('WEDNESDAY', 13, '15:00', '16:00', 60, 'Wednesday 3:00 PM – 4:00 PM'),
  ('WEDNESDAY', 14, '16:30', '17:30', 60, 'Wednesday 4:30 PM – 5:30 PM'),

  ('THURSDAY',   8, '07:30', '08:30', 60, 'Thursday 7:30 AM – 8:30 AM'),
  ('THURSDAY',   9, '09:00', '10:00', 60, 'Thursday 9:00 AM – 10:00 AM'),
  ('THURSDAY',  10, '10:30', '11:30', 60, 'Thursday 10:30 AM – 11:30 AM'),
  ('THURSDAY',  11, '12:00', '13:00', 60, 'Thursday 12:00 PM – 1:00 PM'),
  ('THURSDAY',  12, '13:30', '14:30', 60, 'Thursday 1:30 PM – 2:30 PM'),
  ('THURSDAY',  13, '15:00', '16:00', 60, 'Thursday 3:00 PM – 4:00 PM'),
  ('THURSDAY',  14, '16:30', '17:30', 60, 'Thursday 4:30 PM – 5:30 PM'),

  ('FRIDAY',     8, '07:30', '08:30', 60, 'Friday 7:30 AM – 8:30 AM'),
  ('FRIDAY',     9, '09:00', '10:00', 60, 'Friday 9:00 AM – 10:00 AM'),
  ('FRIDAY',    10, '10:30', '11:30', 60, 'Friday 10:30 AM – 11:30 AM'),
  ('FRIDAY',    11, '12:00', '13:00', 60, 'Friday 12:00 PM – 1:00 PM'),
  ('FRIDAY',    12, '13:30', '14:30', 60, 'Friday 1:30 PM – 2:30 PM'),
  ('FRIDAY',    13, '15:00', '16:00', 60, 'Friday 3:00 PM – 4:00 PM'),
  ('FRIDAY',    14, '16:30', '17:30', 60, 'Friday 4:30 PM – 5:30 PM'),

  ('SATURDAY',   8, '07:30', '08:30', 60, 'Saturday 7:30 AM – 8:30 AM'),
  ('SATURDAY',   9, '09:00', '10:00', 60, 'Saturday 9:00 AM – 10:00 AM'),
  ('SATURDAY',  10, '10:30', '11:30', 60, 'Saturday 10:30 AM – 11:30 AM'),
  ('SATURDAY',  11, '12:00', '13:00', 60, 'Saturday 12:00 PM – 1:00 PM'),
  ('SATURDAY',  12, '13:30', '14:30', 60, 'Saturday 1:30 PM – 2:30 PM'),
  ('SATURDAY',  13, '15:00', '16:00', 60, 'Saturday 3:00 PM – 4:00 PM'),
  ('SATURDAY',  14, '16:30', '17:30', 60, 'Saturday 4:30 PM – 5:30 PM');