-- TEST: 01_basic_happy_path.sql
-- Purpose: Simplest possible schema. Parser must not crash.
-- Expected: 2 tables, 1 FK (posts.user_id → users.id)

CREATE TABLE users (
    id INT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100)
);

CREATE TABLE posts (
    id INT PRIMARY KEY,
    user_id INT NOT NULL,
    title TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
