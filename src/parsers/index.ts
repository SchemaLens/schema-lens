import { CanonicalSchema } from '../types';
import { parseSql } from './sql';
import { parsePrisma } from './prisma';
import { parseDrizzle } from './drizzle';
import { parseKnex } from './knex';

export type ParserFormat = 'sql' | 'prisma' | 'drizzle' | 'knex' | 'unknown';

export function detectFormat(fileName: string, content: string): ParserFormat {
  // Check by file extension first
  if (fileName.endsWith('.prisma')) {
    return 'prisma';
  }
  if (fileName.endsWith('.sql')) {
    return 'sql';
  }

  // For .ts/.js files, detect by content patterns
  if (fileName.endsWith('.ts') || fileName.endsWith('.js')) {
    // Drizzle patterns
    if (content.match(/(pgTable|mysqlTable|sqliteTable)\s*\(/)) {
      return 'drizzle';
    }
    // Knex patterns
    if (content.match(/\.createTable\s*\(/) && content.match(/table\.\w+\s*\(/)) {
      return 'knex';
    }
  }

  return 'unknown';
}

export function parseFile(fileName: string, content: string): CanonicalSchema {
  const format = detectFormat(fileName, content);

  switch (format) {
    case 'sql':
      return parseSql(content);
    case 'prisma':
      return parsePrisma(content);
    case 'drizzle':
      return parseDrizzle(content);
    case 'knex':
      return parseKnex(content);
    case 'unknown':
      throw new Error(
        `Unsupported file format: ${fileName}\nSupported formats: .sql, .prisma, Drizzle schema (.ts), Knex migration (.ts)`
      );
  }
}

export { parseSql, parsePrisma, parseDrizzle, parseKnex };
