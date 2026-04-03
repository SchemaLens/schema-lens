-- TEST: 03_fk_chain.sql
-- Purpose: FK chain across 4 tables. Tests that all relationships are captured.
-- Expected: 4 tables, FK chain: comments → posts → projects → users

CREATE TABLE users (
    id   SERIAL PRIMARY KEY,
    name TEXT   NOT NULL
);

CREATE TABLE projects (
    id      SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    title   TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE posts (
    id         SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    body       TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE comments (
    id      SERIAL PRIMARY KEY,
    post_id INT NOT NULL,
    text    TEXT,
    FOREIGN KEY (post_id) REFERENCES posts(id)
);
