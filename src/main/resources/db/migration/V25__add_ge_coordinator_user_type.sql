ALTER TABLE users DROP CONSTRAINT users_user_type_check;

ALTER TABLE users ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('STUDENT', 'TEACHER', 'ADMIN', 'DEAN', 'PROGRAM_HEAD', 'GE_COORDINATOR'));

INSERT INTO users (user_type, full_name, school_id, email, password_hash, is_active, created_at, updated_at)
VALUES (
    'GE_COORDINATOR',
    'GE Coordinator',
    'GEC-0001',
    'ge.coordinator@timecraft.edu',
    '$2a$12$pCtj4XU678nJscn8o0yfGeKDWIb9idBy6IOU9nUmQdC4Vd9XASDxy',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING