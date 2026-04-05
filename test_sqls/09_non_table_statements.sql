-- TEST: 09_non_table_statements.sql
-- Purpose: SQL files with non-table DDL mixed in (indexes, views, sequences).
--          Parser must ignore these and only return actual tables.
-- Expected: 2 tables (products, categories), 1 FK. No crash on non-table statements.

CREATE SEQUENCE product_id_seq START 1;

CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    category_id INT  NOT NULL,
    name        TEXT NOT NULL,
    price       NUMERIC(10, 2) NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_products_category ON products(category_id);

CREATE VIEW active_products AS
    SELECT id, name, price FROM products WHERE price > 0;
