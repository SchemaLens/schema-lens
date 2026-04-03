-- TEST: 09_non_table_statements.sql
-- Purpose: File contains CREATE INDEX, CREATE EXTENSION, comments, blank lines.
-- Expected: Parser ignores all non-table DDL without crashing.
--           Only the 1 table (users) should appear in the ERD.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    email      TEXT    NOT NULL UNIQUE,
    name       TEXT,
    deleted_at TIMESTAMP
);

-- Index on active users only (partial index)
CREATE INDEX idx_users_active
    ON users (email)
    WHERE deleted_at IS NULL;

-- Regular index
CREATE INDEX idx_users_email ON users (email);

-- View (should be silently skipped)
CREATE VIEW active_users AS
    SELECT * FROM users WHERE deleted_at IS NULL;
