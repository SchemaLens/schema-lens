-- TEST: 10_cyclic_fk.sql
-- Purpose: Two tables referencing each other (cyclic dependency).
-- Expected: Both FKs detected. ERD renderer must not infinite-loop.
-- employees.department_id → departments.id
-- departments.manager_id  → employees.id

CREATE TABLE departments (
    id         SERIAL PRIMARY KEY,
    name       TEXT   NOT NULL,
    manager_id INT
);

CREATE TABLE employees (
    id            SERIAL PRIMARY KEY,
    name          TEXT   NOT NULL,
    department_id INT    NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES employees(id);
