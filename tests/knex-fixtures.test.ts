/// <reference types="jest" />
import { parseKnex } from '../src/parsers/knex';

const migrationSchema = `
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('roles', (table) => {
    table.increments('id');
    table.string('name', 100).notNullable().unique();
    table.text('description').nullable();
  });

  await knex.schema.createTable('members', (table) => {
    table.increments('id');
    table.string('email', 255).notNullable().unique();
    table.string('username', 100).notNullable();
    table.integer('role_id').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('joined_at').notNullable();
    table.foreign('role_id').references('id').inTable('roles');
  });

  await knex.schema.createTable('projects', (table) => {
    table.increments('id');
    table.string('title', 200).notNullable();
    table.text('description').nullable();
    table.integer('owner_id').notNullable();
    table.date('due_date').nullable();
    table.foreign('owner_id').references('id').inTable('members');
  });

  await knex.schema.createTable('tasks', (table) => {
    table.increments('id');
    table.string('name', 255).notNullable();
    table.boolean('completed').notNullable().defaultTo(false);
    table.integer('project_id').notNullable();
    table.integer('assignee_id').nullable();
    table.foreign('project_id').references('id').inTable('projects');
    table.foreign('assignee_id').references('id').inTable('members');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('tasks');
  await knex.schema.dropTable('projects');
  await knex.schema.dropTable('members');
  await knex.schema.dropTable('roles');
}
`;

describe('Knex parser', () => {
  test('parses all createTable calls', () => {
    const schema = parseKnex(migrationSchema);
    const tableNames = new Set(schema.tables.map((t) => t.name));
    expect(tableNames.has('roles')).toBe(true);
    expect(tableNames.has('members')).toBe(true);
    expect(tableNames.has('projects')).toBe(true);
    expect(tableNames.has('tasks')).toBe(true);
    expect(schema.tables.length).toBe(4);
  });

  test('parses increments() as SERIAL primary key', () => {
    const schema = parseKnex(migrationSchema);
    const rolesTable = schema.tables.find((t) => t.name === 'roles');
    const idCol = rolesTable?.columns.find((c) => c.name === 'id');
    expect(idCol?.type).toBe('SERIAL');
    expect(idCol?.primaryKey).toBe(true);
    expect(idCol?.nullable).toBe(false);
  });

  test('parses string() with length as VARCHAR(n)', () => {
    const schema = parseKnex(migrationSchema);
    const rolesTable = schema.tables.find((t) => t.name === 'roles');
    const nameCol = rolesTable?.columns.find((c) => c.name === 'name');
    expect(nameCol?.type).toBe('VARCHAR(100)');
    expect(nameCol?.unique).toBe(true);
    expect(nameCol?.nullable).toBe(false);
  });

  test('parses text() as TEXT', () => {
    const schema = parseKnex(migrationSchema);
    const rolesTable = schema.tables.find((t) => t.name === 'roles');
    const descCol = rolesTable?.columns.find((c) => c.name === 'description');
    expect(descCol?.type).toBe('TEXT');
    expect(descCol?.nullable).toBe(true);
  });

  test('parses boolean() as BOOLEAN', () => {
    const schema = parseKnex(migrationSchema);
    const membersTable = schema.tables.find((t) => t.name === 'members');
    const activeCol = membersTable?.columns.find((c) => c.name === 'is_active');
    expect(activeCol?.type).toBe('BOOLEAN');
  });

  test('parses timestamp() as TIMESTAMP', () => {
    const schema = parseKnex(migrationSchema);
    const membersTable = schema.tables.find((t) => t.name === 'members');
    const joinedCol = membersTable?.columns.find((c) => c.name === 'joined_at');
    expect(joinedCol?.type).toBe('TIMESTAMP');
  });

  test('parses date() as DATE', () => {
    const schema = parseKnex(migrationSchema);
    const projectsTable = schema.tables.find((t) => t.name === 'projects');
    const dueDateCol = projectsTable?.columns.find((c) => c.name === 'due_date');
    expect(dueDateCol?.type).toBe('DATE');
    expect(dueDateCol?.nullable).toBe(true);
  });

  test('detects notNullable() columns', () => {
    const schema = parseKnex(migrationSchema);
    const membersTable = schema.tables.find((t) => t.name === 'members');
    expect(membersTable).toBeDefined();
    const colMap = new Map(membersTable!.columns.map((c) => [c.name, c]));

    expect(colMap.get('email')?.nullable).toBe(false);
    expect(colMap.get('username')?.nullable).toBe(false);
    expect(colMap.get('joined_at')?.nullable).toBe(false);
  });

  test('parses defaultTo() values', () => {
    const schema = parseKnex(migrationSchema);
    const tasksTable = schema.tables.find((t) => t.name === 'tasks');
    const completedCol = tasksTable?.columns.find((c) => c.name === 'completed');
    expect(completedCol?.default).toBe('false');

    const membersTable = schema.tables.find((t) => t.name === 'members');
    const activeCol = membersTable?.columns.find((c) => c.name === 'is_active');
    expect(activeCol?.default).toBe('true');
  });

  test('parses single foreign key reference', () => {
    const schema = parseKnex(migrationSchema);
    const membersTable = schema.tables.find((t) => t.name === 'members');
    const fk = membersTable?.foreignKeys.find((fk) => fk.column === 'role_id');
    expect(fk).toBeDefined();
    expect(fk?.referencesTable).toBe('roles');
    expect(fk?.referencesColumn).toBe('id');
  });

  test('parses multiple foreign keys in one table', () => {
    const schema = parseKnex(migrationSchema);
    const tasksTable = schema.tables.find((t) => t.name === 'tasks');
    expect(tasksTable?.foreignKeys.length).toBe(2);

    const fkCols = new Set(tasksTable!.foreignKeys.map((fk) => fk.column));
    expect(fkCols.has('project_id')).toBe(true);
    expect(fkCols.has('assignee_id')).toBe(true);
  });

  test('resolves FK referencesTable correctly across tables', () => {
    const schema = parseKnex(migrationSchema);
    const projectsTable = schema.tables.find((t) => t.name === 'projects');
    const fk = projectsTable?.foreignKeys.find((fk) => fk.column === 'owner_id');
    expect(fk?.referencesTable).toBe('members');
    expect(fk?.referencesColumn).toBe('id');
  });

  test('returns empty tables array for empty input', () => {
    const schema = parseKnex('');
    expect(schema.tables).toEqual([]);
  });

  test('returns empty tables array for non-knex TS content', () => {
    const schema = parseKnex('const x = 1;\nfunction foo() {}');
    expect(schema.tables).toEqual([]);
  });
});
