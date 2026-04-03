-- TEST: 07_postgres_types.sql
-- Purpose: Postgres-specific column types that may trip up the parser.
-- Expected: 2 tables parsed cleanly. Types stored as-is (UUID, JSONB, etc.)
-- Parser must NOT crash on these types even if it doesn't deeply understand them.

CREATE TABLE tenants (
    id         UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT      NOT NULL,
    metadata   JSONB,
    settings   JSONB     DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE events (
    id             UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id      UUID      NOT NULL,
    aggregate_type TEXT      NOT NULL,
    aggregate_id   UUID      NOT NULL,
    event_type     TEXT      NOT NULL,
    payload        JSONB,
    created_at     TIMESTAMP DEFAULT now(),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
