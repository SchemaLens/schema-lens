-- TEST: 04_self_reference.sql
-- Purpose: Self-referencing FK (tree/hierarchy pattern).
-- Expected: 1 table (categories), 1 FK (parent_id → categories.id)
-- Note: ERD renderer must handle a line from a node back to itself.

CREATE TABLE categories (
    id        SERIAL PRIMARY KEY,
    parent_id INT,
    name      TEXT NOT NULL,
    slug      TEXT NOT NULL UNIQUE,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);
