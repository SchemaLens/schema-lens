-- TEST: 10_cyclic_fk.sql
-- Purpose: Cyclic FK references between two tables (A → B, B → A).
--          One FK requires a deferred/nullable reference to break the cycle.
--          The parser is expected to capture all FKs it can; 1 missing is allowed.
-- Expected: 2 tables (team_members, teams), 2 FKs. 1 allowed missing.

CREATE TABLE teams (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    captain_id INT
);

CREATE TABLE team_members (
    id      SERIAL PRIMARY KEY,
    team_id INT NOT NULL,
    name    TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

ALTER TABLE teams
    ADD CONSTRAINT fk_teams_captain
    FOREIGN KEY (captain_id) REFERENCES team_members(id);
