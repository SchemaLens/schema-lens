-- TEST: 06_alter_table.sql
-- Purpose: FK added via ALTER TABLE after initial CREATE. Common in migrations.
-- Expected: 2 tables. employees.manager_id FK must be detected even though
--           it was added by ALTER TABLE, not in the original CREATE TABLE.

CREATE TABLE departments (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE employees (
    id            SERIAL PRIMARY KEY,
    department_id INT  NOT NULL,
    manager_id    INT,
    name          TEXT NOT NULL,
    salary        DECIMAL(10,2),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE employees
    ADD CONSTRAINT fk_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id);
