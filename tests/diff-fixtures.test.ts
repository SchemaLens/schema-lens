import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFile } from '../src/parsers';
import { diffSchemas } from '../src/diff';

const fixturesDir = path.resolve(__dirname, '../test_sqls');

function parseFixture(fileName: string) {
  const fullPath = path.join(fixturesDir, fileName);
  const sql = fs.readFileSync(fullPath, 'utf-8');
  return parseFile(fileName, sql);
}

describe('Schema diff on real fixtures', () => {
  test('detects added and modified tables between simple and chain schemas', () => {
    const base = parseFixture('01_basic_happy_path.sql');
    const head = parseFixture('03_fk_chain.sql');

    const diff = diffSchemas(base, head);
    const tableStatus = new Map(diff.tables.map((table) => [table.name, table.status]));

    expect(tableStatus.get('users')).toBe('modified');
    expect(tableStatus.get('posts')).toBe('modified');
    expect(tableStatus.get('projects')).toBe('added');
    expect(tableStatus.get('comments')).toBe('added');
  });

  test('captures migration-style additions in employees schema evolution', () => {
    const base = parseFixture('06_alter_table.sql');
    const head = parseFixture('20240801_add_employees.sql');

    const diff = diffSchemas(base, head);
    const tableStatus = new Map(diff.tables.map((table) => [table.name, table.status]));

    expect(tableStatus.get('departments')).toBe('modified');
    expect(tableStatus.get('employees')).toBe('modified');
    expect(tableStatus.get('leave_requests')).toBe('added');
    expect(tableStatus.get('payroll')).toBe('added');
  });
});
