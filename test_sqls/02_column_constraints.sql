-- TEST: 02_column_constraints.sql
-- Purpose: Verify all inline column modifiers are parsed correctly.
-- Expected: 1 table, 8 columns with various constraints detected.

CREATE TABLE products (
    id          SERIAL          PRIMARY KEY,
    sku         VARCHAR(100)    NOT NULL UNIQUE,
    name        VARCHAR(255)    NOT NULL,
    price       DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    stock       INT             DEFAULT 0,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
