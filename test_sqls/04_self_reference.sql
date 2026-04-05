-- TEST: 04_self_reference.sql
-- Purpose: Self-referencing FK (adjacency list / tree structure).
-- Expected: 1 table (employees), 1 self-referencing FK on manager_id → id.

CREATE TABLE employees (
    id         SERIAL PRIMARY KEY,
    name       TEXT    NOT NULL,
    manager_id INT,
    FOREIGN KEY (manager_id) REFERENCES employees(id)
);
