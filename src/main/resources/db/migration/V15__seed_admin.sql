INSERT INTO users (user_type, full_name, school_id, email, password_hash, is_active, created_at, updated_at)
VALUES (
    'ADMIN',
    'System Administrator',
    'ADMIN-0001',
    'admin@timecraft.edu',
    '$2a$12$YGfrqLFvLXsR1oW6WhF.B.S9H1xpErD.VpznJod1s3X1P8FrnTPN.',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;