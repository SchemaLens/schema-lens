-- TEST: 12_empty_and_edge_cases.sql
-- Purpose: Edge cases that should show the empty state, not crash.
-- Expected: 0 tables detected. Empty state UI shown.

-- Only comments and whitespace below this line.
-- No CREATE TABLE statements.

CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE INDEX idx_something ON nonexistent_table (col);

-- A view with no underlying table definition in this file
CREATE VIEW report AS SELECT 1;
