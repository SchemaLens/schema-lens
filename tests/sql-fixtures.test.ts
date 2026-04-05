/// <reference types="node" />
/// <reference types="jest" />
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseFile } from '../src/parsers';

const fixturesDir = path.resolve(__dirname, '../test_sqls');
const emptyEdgeFixture = '12_empty_edge_cases.sql';
const allowedMissingForeignKeysByFixture: Record<string, number> = {
  '06_alter_table.sql': 1,
  '10_cyclic_fk.sql': 1,
  '20240801_add_employees.sql': 1,
  'battle_tested_schema.sql': 1,
};

function getSqlFixtures(): string[] {
  return fs
    .readdirSync(fixturesDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

function extractCreateTableNames(sql: string): string[] {
  const tableNames: string[] = [];
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?[a-zA-Z_][\w$]*"?\.)?"?([a-zA-Z_][\w$]*)"?/gi;

  let match = regex.exec(sql);
  while (match) {
    tableNames.push(match[1]);
    match = regex.exec(sql);
  }

  return tableNames;
}

function extractForeignKeyStatementCount(sql: string): number {
  const fkRegex = /FOREIGN\s+KEY\s*\(/gi;
  return Array.from(sql.matchAll(fkRegex)).length;
}

describe('SQL fixture coverage', () => {
  const fixtures = getSqlFixtures();

  test('loads all fixture files', () => {
    expect(fixtures.length).toBe(15);
  });

  test.each(fixtures)('parses fixture: %s', (fixtureName) => {
    const fixturePath = path.join(fixturesDir, fixtureName);
    const sql = fs.readFileSync(fixturePath, 'utf-8');

    if (fixtureName === emptyEdgeFixture) {
      expect(() => parseFile(fixtureName, sql)).toThrow(/no tables could be parsed/i);
      return;
    }

    const schema = parseFile(fixtureName, sql);
    const parsedTableNames = new Set(schema.tables.map((table) => table.name));
    const expectedTableNames = extractCreateTableNames(sql);

    expect(schema.tables.length).toBeGreaterThan(0);
    expect(expectedTableNames.length).toBeGreaterThan(0);

    for (const expectedTableName of expectedTableNames) {
      expect(parsedTableNames.has(expectedTableName)).toBe(true);
    }

    const expectedFkStatements = extractForeignKeyStatementCount(sql);
    const parsedFkCount = schema.tables.reduce((count, table) => count + table.foreignKeys.length, 0);
    const allowedMissing = allowedMissingForeignKeysByFixture[fixtureName] ?? 0;
    const minimumExpected = Math.max(0, expectedFkStatements - allowedMissing);

    // Composite FKs can map to multiple edges, so parsed count can be higher.
    expect(parsedFkCount).toBeGreaterThanOrEqual(minimumExpected);
  });
});
