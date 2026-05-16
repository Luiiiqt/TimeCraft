ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_online_ts1 BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS is_online_ts2 BOOLEAN NOT NULL DEFAULT FALSE;
-- room = the face-to-face session's room (null if both online)
-- is_online remains as a convenience flag (true if either session is online)