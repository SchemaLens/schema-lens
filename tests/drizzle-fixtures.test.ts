/// <reference types="jest" />
import { parseDrizzle } from '../src/parsers/drizzle';

const basicSchema = `
import { pgTable, integer, varchar, text, boolean, timestamp, uuid, decimal } from 'drizzle-orm/pg-core';
import { mysqlTable, serial } from 'drizzle-orm/mysql-core';
import { sqliteTable } from 'drizzle-orm/sqlite-core';

export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  bio: text('bio'),
  active: boolean('active').notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  userId: integer('user_id').notNull().references(() => users.id),
  publishedAt: timestamp('published_at'),
});

export const products = mysqlTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price').notNull(),
});

export const items = sqliteTable('items', {
  id: integer('id').primaryKey(),
  label: text('label').notNull(),
  productId: integer('product_id').references(() => products.id),
});
`;

describe('Drizzle parser', () => {
  test('parses pgTable, mysqlTable, and sqliteTable declarations', () => {
    const schema = parseDrizzle(basicSchema);
    const tableNames = new Set(schema.tables.map((t) => t.name));
    expect(tableNames.has('users')).toBe(true);
    expect(tableNames.has('posts')).toBe(true);
    expect(tableNames.has('products')).toBe(true);
    expect(tableNames.has('items')).toBe(true);
    expect(schema.tables.length).toBe(4);
  });

  test('maps Drizzle column types to SQL types', () => {
    const schema = parseDrizzle(basicSchema);
    const usersTable = schema.tables.find((t) => t.name === 'users');
    expect(usersTable).toBeDefined();
    const colMap = new Map(usersTable!.columns.map((c) => [c.name, c]));

    expect(colMap.get('id')?.type).toBe('INT');
    expect(colMap.get('email')?.type).toBe('VARCHAR(255)');
    expect(colMap.get('name')?.type).toBe('VARCHAR(100)');
    expect(colMap.get('bio')?.type).toBe('TEXT');
    expect(colMap.get('active')?.type).toBe('BOOLEAN');
    expect(colMap.get('createdAt')?.type).toBe('TIMESTAMP');
  });

  test('marks .primaryKey() columns correctly', () => {
    const schema = parseDrizzle(basicSchema);
    const usersTable = schema.tables.find((t) => t.name === 'users');
    const idCol = usersTable?.columns.find((c) => c.name === 'id');
    expect(idCol?.primaryKey).toBe(true);
    expect(idCol?.nullable).toBe(false);
  });

  test('marks .unique() columns correctly', () => {
    const schema = parseDrizzle(basicSchema);
    const usersTable = schema.tables.find((t) => t.name === 'users');
    const emailCol = usersTable?.columns.find((c) => c.name === 'email');
    expect(emailCol?.unique).toBe(true);
  });

  test('detects nullable vs non-nullable columns', () => {
    const schema = parseDrizzle(basicSchema);
    const postsTable = schema.tables.find((t) => t.name === 'posts');
    expect(postsTable).toBeDefined();
    const colMap = new Map(postsTable!.columns.map((c) => [c.name, c]));

    expect(colMap.get('title')?.nullable).toBe(false);   // .notNull()
    expect(colMap.get('content')?.nullable).toBe(true);  // no constraint
    expect(colMap.get('publishedAt')?.nullable).toBe(true);
  });

  test('extracts foreign keys from .references()', () => {
    const schema = parseDrizzle(basicSchema);
    const postsTable = schema.tables.find((t) => t.name === 'posts');
    expect(postsTable?.foreignKeys.length).toBeGreaterThanOrEqual(1);

    const fk = postsTable?.foreignKeys.find((fk) => fk.column === 'userId');
    expect(fk).toBeDefined();
    expect(fk?.referencesTable).toBe('users');
    expect(fk?.referencesColumn).toBe('id');
  });

  test('handles foreign key in sqlite table referencing mysql table', () => {
    const schema = parseDrizzle(basicSchema);
    const itemsTable = schema.tables.find((t) => t.name === 'items');
    const fk = itemsTable?.foreignKeys.find((fk) => fk.column === 'productId');
    expect(fk).toBeDefined();
    expect(fk?.referencesTable).toBe('products');
    expect(fk?.referencesColumn).toBe('id');
  });

  test('parses varchar length from object option', () => {
    const schema = parseDrizzle(basicSchema);
    const postsTable = schema.tables.find((t) => t.name === 'posts');
    const titleCol = postsTable?.columns.find((c) => c.name === 'title');
    expect(titleCol?.type).toBe('VARCHAR(200)');
  });

  test('parses uuid type from pgTable', () => {
    const schema = parseDrizzle(basicSchema);
    const postsTable = schema.tables.find((t) => t.name === 'posts');
    const idCol = postsTable?.columns.find((c) => c.name === 'id');
    expect(idCol?.type).toBe('UUID');
    expect(idCol?.primaryKey).toBe(true);
  });

  test('parses serial type from mysqlTable', () => {
    const schema = parseDrizzle(basicSchema);
    const productsTable = schema.tables.find((t) => t.name === 'products');
    const idCol = productsTable?.columns.find((c) => c.name === 'id');
    expect(idCol?.type).toBe('SERIAL');
    expect(idCol?.primaryKey).toBe(true);
  });

  test('returns empty tables array for empty input', () => {
    const schema = parseDrizzle('');
    expect(schema.tables).toEqual([]);
  });

  test('returns empty tables array for non-drizzle TS content', () => {
    const schema = parseDrizzle('const x = 1;\nfunction foo() {}');
    expect(schema.tables).toEqual([]);
  });
});
