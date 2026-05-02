-- V25__add_ge_coordinator_user_type.sql
-- user_type is stored as VARCHAR, not a PostgreSQL enum.
-- GE_COORDINATOR is handled by the Java UserType enum with @Enumerated(EnumType.STRING).
SELECT 1;