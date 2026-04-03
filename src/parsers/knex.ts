import { CanonicalSchema, Column, ForeignKey, Table } from '../types';
import * as ts from 'typescript';

export function parseKnex(content: string): CanonicalSchema {
  const sourceFile = ts.createSourceFile(
    'migration.ts',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  const tables: Table[] = [];

  function visit(node: ts.Node): void {
    // Look for: knex.schema.createTable('name', (table) => { ... })
    // or: schema.createTable(...)
    if (ts.isCallExpression(node)) {
      const callText = node.expression.getText();
      if (callText.match(/\.createTable$/)) {
        const table = tryParseCreateTable(node);
        if (table) { tables.push(table); }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { tables };
}

function tryParseCreateTable(call: ts.CallExpression): Table | null {
  const args = call.arguments;
  if (args.length < 2) { return null; }

  // First arg: table name
  const nameArg = args[0];
  let tableName = '';
  if (ts.isStringLiteral(nameArg)) {
    tableName = nameArg.text;
  } else {
    return null;
  }

  // Second arg: callback function
  const callbackArg = args[1];
  if (!ts.isArrowFunction(callbackArg) && !ts.isFunctionExpression(callbackArg)) {
    return null;
  }

  // Get the table parameter name
  const tableParam = callbackArg.parameters[0];
  if (!tableParam) { return null; }
  const tableParamName = tableParam.name.getText();

  const columns: Column[] = [];
  const foreignKeys: ForeignKey[] = [];
  const primaryKeyCols = new Set<string>();
  const uniqueCols = new Set<string>();

  const body = callbackArg.body;
  if (!body) { return null; }

  // Visit statements in the callback body
  function visitBody(node: ts.Node): void {
    if (ts.isExpressionStatement(node)) {
      parseTableStatement(node.expression, tableParamName, columns, foreignKeys, primaryKeyCols, uniqueCols);
    }
    ts.forEachChild(node, visitBody);
  }

  if (ts.isBlock(body)) {
    visitBody(body);
  }

  // Apply primary key and unique constraints
  for (const col of columns) {
    if (primaryKeyCols.has(col.name)) { col.primaryKey = true; col.nullable = false; }
    if (uniqueCols.has(col.name)) { col.unique = true; }
  }

  return { name: tableName, columns, foreignKeys };
}

function parseTableStatement(
  expr: ts.Expression,
  tableParamName: string,
  columns: Column[],
  foreignKeys: ForeignKey[],
  primaryKeyCols: Set<string>,
  uniqueCols: Set<string>
): void {
  const fullText = expr.getText();

  // Check for table.primary(['id'])
  const primaryMatch = fullText.match(new RegExp(`${tableParamName}\\.primary\\s*\\(\\s*\\[([^\\]]+)\\]`));
  if (primaryMatch) {
    const cols = primaryMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    cols.forEach(c => primaryKeyCols.add(c));
    return;
  }

  // Check for table.unique(['email'])
  const uniqueMatch = fullText.match(new RegExp(`${tableParamName}\\.unique\\s*\\(\\s*\\[([^\\]]+)\\]`));
  if (uniqueMatch) {
    const cols = uniqueMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    cols.forEach(c => uniqueCols.add(c));
    return;
  }

  // Check for table.foreign('col').references('id').inTable('otherTable')
  const foreignMatch = fullText.match(
    new RegExp(`${tableParamName}\\.foreign\\s*\\(\\s*['"]([^'"]+)['"]\\)\\s*\\.references\\s*\\(\\s*['"]([^'"]+)['"]\\)\\s*\\.inTable\\s*\\(\\s*['"]([^'"]+)['"]\\)`)
  );
  if (foreignMatch) {
    foreignKeys.push({
      column: foreignMatch[1],
      referencesTable: foreignMatch[3],
      referencesColumn: foreignMatch[2],
    });
    return;
  }

  // Parse column definitions: table.string('name', 100), table.integer('age'), etc.
  const colMatch = fullText.match(new RegExp(`${tableParamName}\\.(\\w+)\\s*\\(\\s*['"]([^'"]+)['"]`));
  if (!colMatch) { return; }

  const methodName = colMatch[1];
  const colName = colMatch[2];

  // Skip non-column methods
  if (['primary', 'unique', 'foreign', 'index', 'timestamps', 'dropColumn', 'renameColumn'].includes(methodName)) {
    return;
  }

  const colType = mapKnexType(methodName);
  const isNotNullable = /\.notNullable\s*\(/.test(fullText);
  const isNullable = /\.nullable\s*\(/.test(fullText);
  const isUnique = /\.unique\s*\(/.test(fullText);
  const isPrimary = /\.primary\s*\(/.test(fullText);
  const isIncrement = methodName === 'increments' || methodName === 'bigIncrements';

  let defaultVal: string | undefined;
  const defaultMatch = fullText.match(/\.defaultTo\s*\(([^)]+)\)/);
  if (defaultMatch) {
    defaultVal = defaultMatch[1].trim();
  }

  // Get length param if present
  let finalType = colType;
  const lengthMatch = fullText.match(new RegExp(`${tableParamName}\\.${methodName}\\s*\\(\\s*['"][^'"]+['"]\\s*,\\s*(\\d+)`));
  if (lengthMatch) {
    finalType = `${colType}(${lengthMatch[1]})`;
  }

  const col: Column = {
    name: colName,
    type: finalType,
    nullable: isNullable || (!isNotNullable && !isIncrement && !isPrimary),
    primaryKey: isPrimary || isIncrement,
    unique: isUnique,
    default: defaultVal,
  };

  columns.push(col);
}

function mapKnexType(method: string): string {
  const map: Record<string, string> = {
    'increments': 'SERIAL',
    'bigIncrements': 'BIGSERIAL',
    'integer': 'INT',
    'bigInteger': 'BIGINT',
    'tinyint': 'TINYINT',
    'smallint': 'SMALLINT',
    'mediumint': 'MEDIUMINT',
    'float': 'FLOAT',
    'double': 'DOUBLE',
    'decimal': 'DECIMAL',
    'string': 'VARCHAR',
    'text': 'TEXT',
    'boolean': 'BOOLEAN',
    'date': 'DATE',
    'datetime': 'DATETIME',
    'timestamp': 'TIMESTAMP',
    'time': 'TIME',
    'binary': 'BLOB',
    'json': 'JSON',
    'jsonb': 'JSONB',
    'uuid': 'UUID',
    'enu': 'ENUM',
    'enum': 'ENUM',
    'specificType': 'CUSTOM',
  };
  return map[method] || method.toUpperCase();
}
