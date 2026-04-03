-- ============================================
-- Migration: 20240801_add_employees
-- Adds HR / employee management tables
-- ============================================

CREATE TABLE departments (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    budget DECIMAL(12, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE employees (
    id INT NOT NULL AUTO_INCREMENT,
    department_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    hired_at DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (id),
    UNIQUE (email),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE employees
    ADD COLUMN manager_id INT,
    ADD CONSTRAINT fk_manager
        FOREIGN KEY (manager_id) REFERENCES employees(id);

CREATE TABLE leave_requests (
    id INT NOT NULL AUTO_INCREMENT,
    employee_id INT NOT NULL,
    approved_by INT,
    leave_type VARCHAR(50) NOT NULL DEFAULT 'annual',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reason TEXT,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (approved_by) REFERENCES employees(id)
);

CREATE TABLE payroll (
    id INT NOT NULL AUTO_INCREMENT,
    employee_id INT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_pay DECIMAL(10, 2) NOT NULL,
    deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_pay DECIMAL(10, 2) NOT NULL,
    paid_at TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);