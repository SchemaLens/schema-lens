-- TEST: 08_check_and_composite_unique.sql
-- Purpose: CHECK constraints and composite UNIQUE constraints.
-- Expected: Parser must SKIP/IGNORE these without crashing.
--           Tables and FKs should still be detected correctly.
-- This is the most common parser crash point.

CREATE TABLE users (
    id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id  UUID    NOT NULL,
    email      TEXT    NOT NULL,
    status     TEXT    CHECK (status IN ('active', 'disabled', 'pending')),
    age        INT     CHECK (age >= 0 AND age < 150),
    UNIQUE (tenant_id, email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE tenants (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan TEXT CHECK (plan IN ('free', 'pro', 'enterprise')) DEFAULT 'free'
);
