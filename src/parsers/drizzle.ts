import { CanonicalSchema, Column, ForeignKey, Table } from '../types';
import * as ts from 'typescript';

export function parseDrizzle(content: string): CanonicalSchema {
  const sourceFile = ts.createSourceFile(
    'schema.ts',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const tables: Table[] = [];

  function visit(node: ts.Node): void {
    // Look for: export const xxx = pgTable('name', { ... })
    // or: const xxx = mysqlTable('name', { ... })
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (decl.initializer && ts.isCallExpression(decl.initializer)) {
          const table = tryParseTableCall(decl.initializer, content);
          if (table) { tables.push(table); }
        }
      }
    }
    // Also check bare call expressions at module level
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      const table = tryParseTableCall(node.expression, content);
      if (table) { tables.push(table); }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { tables };
}

function tryParseTableCall(call: ts.CallExpression, source: string): Table | null {
  const funcName = call.expression.getText();
  if (!funcName.match(/(pgTable|mysqlTable|sqliteTable)$/)) { return null; }

  const args = call.arguments;
  if (args.length < 2) { return null; }

  // First arg: table name string
  const tableNameArg = args[0];
  let tableName = '';
  if (ts.isStringLiteral(tableNameArg)) {
    tableName = tableNameArg.text;
  } else {
    return null;
  }

  // Second arg: object literal with column definitions
  const columnsArg = args[1];
  if (!ts.isObjectLiteralExpression(columnsArg)) { return null; }

  const columns: Column[] = [];
  const foreignKeys: ForeignKey[] = [];

  for (const prop of columnsArg.properties) {
    if (!ts.isPropertyAssignment(prop)) { continue; }
    const colName = prop.name?.getText() || '';
    if (!colName) { continue; }

    const col = parseColumnExpression(colName, prop.initializer, source, foreignKeys);
    if (col) { columns.push(col); }
  }

  return { name: tableName, columns, foreignKeys };
}

function parseColumnExpression(
  colName: string,
  expr: ts.Expression,
  source: string,
  foreignKeys: ForeignKey[]
): Column | null {
  const fullText = expr.getText();

  // Determine the base type from the function call
  let colType = 'UNKNOWN';
  const typeMatch = fullText.match(/^(\w+)\s*\(/);
  if (typeMatch) {
    colType = mapDrizzleType(typeMatch[1]);
  }

  // Check for length param like varchar('col', { length: 255 })
  const lengthMatch = fullText.match(/length:\s*(\d+)/);
  if (lengthMatch) {
    colType = `${colType}(${lengthMatch[1]})`;
  }

  const isPrimaryKey = /\.primaryKey\s*\(/.test(fullText);
  const isNotNull = /\.notNull\s*\(/.test(fullText);
  const isUnique = /\.unique\s*\(/.test(fullText);
  const nullable = !isNotNull && !isPrimaryKey;

  let defaultVal: string | undefined;
  const defaultMatch = fullText.match(/\.default\s*\(([^)]+)\)/);
  if (defaultMatch) {
    defaultVal = defaultMatch[1].trim();
  }

  // Check for .references(() => otherTable.column)
  const refMatch = fullText.match(/\.references\s*\(\s*\(\)\s*=>\s*(\w+)\.(\w+)/);
  if (refMatch) {
    foreignKeys.push({
      column: colName,
      referencesTable: refMatch[1],
      referencesColumn: refMatch[2],
    });
  }

  return {
    name: colName,
    type: colType,
    nullable,
    primaryKey: isPrimaryKey,
    unique: isUnique,
    default: defaultVal,
  };
}

function mapDrizzleType(drizzleType: string): string {
  const map: Record<string, string> = {
    'integer': 'INT',
    'int': 'INT',
    'bigint': 'BIGINT',
    'smallint': 'SMALLINT',
    'serial': 'SERIAL',
    'bigserial': 'BIGSERIAL',
    'varchar': 'VARCHAR',
    'char': 'CHAR',
    'text': 'TEXT',
    'boolean': 'BOOLEAN',
    'timestamp': 'TIMESTAMP',
    'date': 'DATE',
    'time': 'TIME',
    'json': 'JSON',
    'jsonb': 'JSONB',
    'uuid': 'UUID',
    'numeric': 'NUMERIC',
    'decimal': 'DECIMAL',
    'real': 'REAL',
    'doublePrecision': 'DOUBLE PRECISION',
    'float': 'FLOAT',
    'blob': 'BLOB',
  };
  return map[drizzleType] || drizzleType.toUpperCase();
}
