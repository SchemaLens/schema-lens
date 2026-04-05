// ============================================
// Knex Migration: HR & Payroll Platform
// ============================================
// Tables: departments, employees, positions, salaries, leave_requests
// FKs: employees → departments, employees → positions,
//      salaries → employees, leave_requests → employees

// Inline stub — knex is not a project dependency; this file is a parser fixture only.
interface TableBuilder {
  increments(col: string): TableBuilder;
  integer(col: string): TableBuilder;
  string(col: string, length?: number): TableBuilder;
  text(col: string): TableBuilder;
  boolean(col: string): TableBuilder;
  decimal(col: string): TableBuilder;
  date(col: string): TableBuilder;
  timestamp(col: string): TableBuilder;
  notNullable(): TableBuilder;
  nullable(): TableBuilder;
  unique(): TableBuilder;
  defaultTo(val: unknown): TableBuilder;
  foreign(col: string): { references(col: string): { inTable(table: string): void } };
}
interface SchemaBuilder {
  createTable(name: string, cb: (table: TableBuilder) => void): Promise<void>;
  dropTable(name: string): Promise<void>;
}
interface KnexLike { schema: SchemaBuilder; }

export async function up(knex: KnexLike): Promise<void> {
  await knex.schema.createTable('departments', (table) => {
    table.increments('id');
    table.string('name', 150).notNullable().unique();
    table.string('cost_center', 20).nullable();
    table.integer('manager_id').nullable();
  });

  await knex.schema.createTable('positions', (table) => {
    table.increments('id');
    table.string('title', 150).notNullable().unique();
    table.string('level', 50).nullable();
    table.decimal('base_salary_min').nullable();
    table.decimal('base_salary_max').nullable();
  });

  await knex.schema.createTable('employees', (table) => {
    table.increments('id');
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.integer('department_id').notNullable();
    table.integer('position_id').notNullable();
    table.date('hire_date').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.foreign('department_id').references('id').inTable('departments');
    table.foreign('position_id').references('id').inTable('positions');
  });

  await knex.schema.createTable('salaries', (table) => {
    table.increments('id');
    table.integer('employee_id').notNullable();
    table.decimal('amount').notNullable();
    table.string('currency', 3).notNullable().defaultTo('USD');
    table.date('effective_from').notNullable();
    table.date('effective_to').nullable();
    table.foreign('employee_id').references('id').inTable('employees');
  });

  await knex.schema.createTable('leave_requests', (table) => {
    table.increments('id');
    table.integer('employee_id').notNullable();
    table.string('type', 50).notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.string('status', 30).notNullable().defaultTo('pending');
    table.text('notes').nullable();
    table.foreign('employee_id').references('id').inTable('employees');
  });
}

export async function down(knex: KnexLike): Promise<void> {
  await knex.schema.dropTable('leave_requests');
  await knex.schema.dropTable('salaries');
  await knex.schema.dropTable('employees');
  await knex.schema.dropTable('positions');
  await knex.schema.dropTable('departments');
}
