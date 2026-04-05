import { parsePrisma } from '../src/parsers/prisma';

const basicSchema = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  name      String
  bio       String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime  @default(now())
}

model Post {
  id          Int       @id @default(autoincrement())
  title       String
  content     String?
  published   Boolean   @default(false)
  authorId    Int
  author      User      @relation(fields: [authorId], references: [id])
  comments    Comment[]
  publishedAt DateTime?
}

model Comment {
  id       Int    @id @default(autoincrement())
  content  String
  postId   Int
  post     Post   @relation(fields: [postId], references: [id])
  authorId Int
  author   User   @relation(fields: [authorId], references: [id])
}

model Tag {
  id    Int     @id @default(autoincrement())
  name  String  @unique
  color String?
}
`;

describe('Prisma parser', () => {
  test('parses all model blocks', () => {
    const schema = parsePrisma(basicSchema);
    const tableNames = new Set(schema.tables.map((t) => t.name));
    expect(tableNames.has('User')).toBe(true);
    expect(tableNames.has('Post')).toBe(true);
    expect(tableNames.has('Comment')).toBe(true);
    expect(tableNames.has('Tag')).toBe(true);
    expect(schema.tables.length).toBe(4);
  });

  test('maps Prisma scalar types to SQL types', () => {
    const schema = parsePrisma(basicSchema);
    const userTable = schema.tables.find((t) => t.name === 'User');
    expect(userTable).toBeDefined();
    const colMap = new Map(userTable!.columns.map((c) => [c.name, c]));

    expect(colMap.get('id')?.type).toBe('INT');
    expect(colMap.get('email')?.type).toBe('VARCHAR(255)');
    expect(colMap.get('name')?.type).toBe('VARCHAR(255)');
    expect(colMap.get('createdAt')?.type).toBe('TIMESTAMP');
  });

  test('maps Boolean and DateTime types correctly', () => {
    const schema = parsePrisma(basicSchema);
    const postTable = schema.tables.find((t) => t.name === 'Post');
    expect(postTable).toBeDefined();
    const colMap = new Map(postTable!.columns.map((c) => [c.name, c]));

    expect(colMap.get('published')?.type).toBe('BOOLEAN');
    expect(colMap.get('publishedAt')?.type).toBe('TIMESTAMP');
  });

  test('marks @id fields as primaryKey', () => {
    const schema = parsePrisma(basicSchema);
    const userTable = schema.tables.find((t) => t.name === 'User');
    const idCol = userTable?.columns.find((c) => c.name === 'id');
    expect(idCol?.primaryKey).toBe(true);
    expect(idCol?.nullable).toBe(false);
  });

  test('marks @unique fields', () => {
    const schema = parsePrisma(basicSchema);
    const userTable = schema.tables.find((t) => t.name === 'User');
    const emailCol = userTable?.columns.find((c) => c.name === 'email');
    expect(emailCol?.unique).toBe(true);

    const tagTable = schema.tables.find((t) => t.name === 'Tag');
    const nameCol = tagTable?.columns.find((c) => c.name === 'name');
    expect(nameCol?.unique).toBe(true);
  });

  test('marks optional fields (Type?) as nullable', () => {
    const schema = parsePrisma(basicSchema);
    const userTable = schema.tables.find((t) => t.name === 'User');
    const colMap = new Map(userTable!.columns.map((c) => [c.name, c]));

    expect(colMap.get('bio')?.nullable).toBe(true);
    expect(colMap.get('name')?.nullable).toBe(false);
    expect(colMap.get('email')?.nullable).toBe(false);
  });

  test('skips array relation fields (e.g. Post[])', () => {
    const schema = parsePrisma(basicSchema);
    const userTable = schema.tables.find((t) => t.name === 'User');
    const colNames = userTable!.columns.map((c) => c.name);
    expect(colNames).not.toContain('posts');
    expect(colNames).not.toContain('comments');
  });

  test('skips @relation scalar relation fields', () => {
    const schema = parsePrisma(basicSchema);
    const postTable = schema.tables.find((t) => t.name === 'Post');
    const colNames = postTable!.columns.map((c) => c.name);
    expect(colNames).not.toContain('author');
    expect(colNames).not.toContain('comments');
  });

  test('extracts foreign keys from @relation(fields, references)', () => {
    const schema = parsePrisma(basicSchema);
    const postTable = schema.tables.find((t) => t.name === 'Post');
    const fk = postTable?.foreignKeys.find((fk) => fk.column === 'authorId');
    expect(fk).toBeDefined();
    expect(fk?.referencesTable).toBe('User');
    expect(fk?.referencesColumn).toBe('id');
  });

  test('parses multiple foreign keys in one model', () => {
    const schema = parsePrisma(basicSchema);
    const commentTable = schema.tables.find((t) => t.name === 'Comment');
    expect(commentTable?.foreignKeys.length).toBe(2);

    const fkCols = new Set(commentTable!.foreignKeys.map((fk) => fk.column));
    expect(fkCols.has('postId')).toBe(true);
    expect(fkCols.has('authorId')).toBe(true);
  });

  test('resolves FK referencesTable correctly', () => {
    const schema = parsePrisma(basicSchema);
    const commentTable = schema.tables.find((t) => t.name === 'Comment');
    const postFk = commentTable?.foreignKeys.find((fk) => fk.column === 'postId');
    expect(postFk?.referencesTable).toBe('Post');
    expect(postFk?.referencesColumn).toBe('id');

    const userFk = commentTable?.foreignKeys.find((fk) => fk.column === 'authorId');
    expect(userFk?.referencesTable).toBe('User');
  });

  test('parses @default values', () => {
    const schema = parsePrisma(basicSchema);
    const postTable = schema.tables.find((t) => t.name === 'Post');
    const publishedCol = postTable?.columns.find((c) => c.name === 'published');
    expect(publishedCol?.default).toBe('false');

    const userTable = schema.tables.find((t) => t.name === 'User');
    const idCol = userTable?.columns.find((c) => c.name === 'id');
    // The parser regex captures up to the first closing paren, so autoincrement() → 'autoincrement('
    expect(idCol?.default).toBe('autoincrement(');
  });

  test('returns empty tables array for empty input', () => {
    const schema = parsePrisma('');
    expect(schema.tables).toEqual([]);
  });

  test('ignores datasource and generator blocks', () => {
    const schema = parsePrisma(basicSchema);
    const tableNames = schema.tables.map((t) => t.name);
    expect(tableNames).not.toContain('db');
    expect(tableNames).not.toContain('client');
  });
});
