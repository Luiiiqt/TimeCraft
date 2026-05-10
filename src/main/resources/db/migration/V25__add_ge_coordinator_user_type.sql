-- V25__add_ge_coordinator_user_type.sql
SELECT 1;

INSERT INTO users (user_type, full_name, school_id, email, password_hash, is_active, created_at, updated_at)
VALUES (
    'GE_COORDINATOR',
    'GE Coordinator',
    'GEC-0001',
    'ge.coordinator@timecraft.edu',
    '$2a$12$pCtj4XU678nJscn8o0yfGeKDWIb9idBy6IOU9nUmQdC4Vd9XASDxy',  --password: "gened123"
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;