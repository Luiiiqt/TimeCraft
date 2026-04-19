                                                -- ============================================================
                                                -- V4: Timeslots
                                                --
                                                --  Window : 7:30 AM – 6:00 PM (Mon–Sat)
                                                --  Block  : 90 minutes per slot (matches all subject durations)
                                                --  Gap    : 0 minutes between slots (back-to-back grid)
                                                --
                                                --  Slot grid (6 slots per day):
                                                --    Slot 1 : 07:30 – 09:00
                                                --    Slot 2 : 09:00 – 10:30
                                                --    Slot 3 : 10:30 – 12:00
                                                --    Slot 4 : 12:00 – 13:30    ← includes lunch; schedulable
                                                --    Slot 5 : 13:30 – 15:00
                                                --    Slot 6 : 15:00 – 16:30
                                                --    Slot 7 : 16:30 – 18:00
                                                --  Total: 7 slots × 6 days = 42 timeslots
                                                -- ============================================================

                                                CREATE TABLE timeslots (
                                                    id          BIGSERIAL   PRIMARY KEY,
                                                    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN (
                                                                                'MONDAY','TUESDAY','WEDNESDAY',
                                                                                'THURSDAY','FRIDAY','SATURDAY'
                                                                            )),
                                                    slot_number SMALLINT    NOT NULL CHECK (slot_number BETWEEN 1 AND 7),
                                                    start_time  TIME        NOT NULL,
                                                    end_time    TIME        NOT NULL,
                                                    label       VARCHAR(60) NOT NULL,   -- e.g. 'Monday 7:30 AM – 9:00 AM'

                                                    CONSTRAINT chk_end_after_start CHECK (end_time > start_time),
                                                    CONSTRAINT uq_timeslot_day_slot UNIQUE (day_of_week, slot_number)
                                                );

                                                -- ── Seed all 42 timeslots (Mon–Sat × 7 slots) ────────────────────────────────

                                                INSERT INTO timeslots (day_of_week, slot_number, start_time, end_time, label) VALUES

                                                    -- Monday
                                                    ('MONDAY', 1, '07:30', '09:00', 'Monday 7:30 AM – 9:00 AM'),
                                                    ('MONDAY', 2, '09:00', '10:30', 'Monday 9:00 AM – 10:30 AM'),
                                                    ('MONDAY', 3, '10:30', '12:00', 'Monday 10:30 AM – 12:00 PM'),
                                                    ('MONDAY', 4, '12:00', '13:30', 'Monday 12:00 PM – 1:30 PM'),
                                                    ('MONDAY', 5, '13:30', '15:00', 'Monday 1:30 PM – 3:00 PM'),
                                                    ('MONDAY', 6, '15:00', '16:30', 'Monday 3:00 PM – 4:30 PM'),
                                                    ('MONDAY', 7, '16:30', '18:00', 'Monday 4:30 PM – 6:00 PM'),

                                                    -- Tuesday
                                                    ('TUESDAY', 1, '07:30', '09:00', 'Tuesday 7:30 AM – 9:00 AM'),
                                                    ('TUESDAY', 2, '09:00', '10:30', 'Tuesday 9:00 AM – 10:30 AM'),
                                                    ('TUESDAY', 3, '10:30', '12:00', 'Tuesday 10:30 AM – 12:00 PM'),
                                                    ('TUESDAY', 4, '12:00', '13:30', 'Tuesday 12:00 PM – 1:30 PM'),
                                                    ('TUESDAY', 5, '13:30', '15:00', 'Tuesday 1:30 PM – 3:00 PM'),
                                                    ('TUESDAY', 6, '15:00', '16:30', 'Tuesday 3:00 PM – 4:30 PM'),
                                                    ('TUESDAY', 7, '16:30', '18:00', 'Tuesday 4:30 PM – 6:00 PM'),

                                                    -- Wednesday
                                                    ('WEDNESDAY', 1, '07:30', '09:00', 'Wednesday 7:30 AM – 9:00 AM'),
                                                    ('WEDNESDAY', 2, '09:00', '10:30', 'Wednesday 9:00 AM – 10:30 AM'),
                                                    ('WEDNESDAY', 3, '10:30', '12:00', 'Wednesday 10:30 AM – 12:00 PM'),
                                                    ('WEDNESDAY', 4, '12:00', '13:30', 'Wednesday 12:00 PM – 1:30 PM'),
                                                    ('WEDNESDAY', 5, '13:30', '15:00', 'Wednesday 1:30 PM – 3:00 PM'),
                                                    ('WEDNESDAY', 6, '15:00', '16:30', 'Wednesday 3:00 PM – 4:30 PM'),
                                                    ('WEDNESDAY', 7, '16:30', '18:00', 'Wednesday 4:30 PM – 6:00 PM'),

                                                    -- Thursday
                                                    ('THURSDAY', 1, '07:30', '09:00', 'Thursday 7:30 AM – 9:00 AM'),
                                                    ('THURSDAY', 2, '09:00', '10:30', 'Thursday 9:00 AM – 10:30 AM'),
                                                    ('THURSDAY', 3, '10:30', '12:00', 'Thursday 10:30 AM – 12:00 PM'),
                                                    ('THURSDAY', 4, '12:00', '13:30', 'Thursday 12:00 PM – 1:30 PM'),
                                                    ('THURSDAY', 5, '13:30', '15:00', 'Thursday 1:30 PM – 3:00 PM'),
                                                    ('THURSDAY', 6, '15:00', '16:30', 'Thursday 3:00 PM – 4:30 PM'),
                                                    ('THURSDAY', 7, '16:30', '18:00', 'Thursday 4:30 PM – 6:00 PM'),

                                                    -- Friday
                                                    ('FRIDAY', 1, '07:30', '09:00', 'Friday 7:30 AM – 9:00 AM'),
                                                    ('FRIDAY', 2, '09:00', '10:30', 'Friday 9:00 AM – 10:30 AM'),
                                                    ('FRIDAY', 3, '10:30', '12:00', 'Friday 10:30 AM – 12:00 PM'),
                                                    ('FRIDAY', 4, '12:00', '13:30', 'Friday 12:00 PM – 1:30 PM'),
                                                    ('FRIDAY', 5, '13:30', '15:00', 'Friday 1:30 PM – 3:00 PM'),
                                                    ('FRIDAY', 6, '15:00', '16:30', 'Friday 3:00 PM – 4:30 PM'),
                                                    ('FRIDAY', 7, '16:30', '18:00', 'Friday 4:30 PM – 6:00 PM'),

                                                    -- Saturday
                                                    ('SATURDAY', 1, '07:30', '09:00', 'Saturday 7:30 AM – 9:00 AM'),
                                                    ('SATURDAY', 2, '09:00', '10:30', 'Saturday 9:00 AM – 10:30 AM'),
                                                    ('SATURDAY', 3, '10:30', '12:00', 'Saturday 10:30 AM – 12:00 PM'),
                                                    ('SATURDAY', 4, '12:00', '13:30', 'Saturday 12:00 PM – 1:30 PM'),
                                                    ('SATURDAY', 5, '13:30', '15:00', 'Saturday 1:30 PM – 3:00 PM'),
                                                    ('SATURDAY', 6, '15:00', '16:30', 'Saturday 3:00 PM – 4:30 PM'),
                                                    ('SATURDAY', 7, '16:30', '18:00', 'Saturday 4:30 PM – 6:00 PM');

                                                -- ── Teacher availability per timeslot ─────────────────────────────────────────
                                                CREATE TABLE teacher_availability (
                                                    id          BIGSERIAL   PRIMARY KEY,
                                                    teacher_id  BIGINT      NOT NULL,
                                                    timeslot_id BIGINT      NOT NULL,
                                                    available   BOOLEAN     NOT NULL DEFAULT TRUE,

                                                    CONSTRAINT fk_availability_teacher
                                                        FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE,
                                                    CONSTRAINT fk_availability_timeslot
                                                        FOREIGN KEY (timeslot_id) REFERENCES timeslots (id) ON DELETE CASCADE,
                                                    CONSTRAINT uq_availability_teacher_timeslot
                                                        UNIQUE (teacher_id, timeslot_id)
                                                );

                                                COMMENT ON TABLE  timeslots             IS 'All 42 schedulable time blocks: Mon–Sat, 7:30 AM–6:00 PM, 90 min each';
                                                COMMENT ON COLUMN timeslots.slot_number IS '1 = earliest (7:30 AM), 7 = latest (4:30 PM start)';
                                                COMMENT ON TABLE  teacher_availability  IS 'Teacher-declared availability per timeslot; consulted by the scheduling engine';