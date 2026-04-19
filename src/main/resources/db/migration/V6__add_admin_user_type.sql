-- ============================================================
-- V6: Add ADMIN to users.user_type check constraint
--      and seed the default admin account
-- ============================================================

-- Drop old constraint and re-create with ADMIN included
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_user_type_check;

ALTER TABLE users
    ADD CONSTRAINT users_user_type_check
    CHECK (user_type IN ('STUDENT', 'TEACHER', 'ADMIN', 'DEAN'));

-- ── Seed admin user ───────────────────────────────────────────
-- Password: Admin@1234
-- BCrypt hash for 'Admin@1234':
--   $2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.

INSERT INTO users (user_type, full_name, school_id, email, password_hash)
VALUES (
    'ADMIN',
    'System Administrator',
    'ADMIN-0001',
    'admin@timecraft.edu',
    '$2a$12$ml3rziwivU84u37WtqNpl.3GZ13BbYGi1SJg0WG0Z3xoCIYS9UI7u'
)
ON CONFLICT (email) DO NOTHING;

DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'TimeCraft V8 applied.';
    RAISE NOTICE '  Admin email   : admin@timecraft.edu';
    RAISE NOTICE '  Admin password: Admin@1234';
    RAISE NOTICE '  CHANGE THIS PASSWORD before going live!';
    RAISE NOTICE '=======================================================';
END $$;