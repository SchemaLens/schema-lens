import { Parser } from 'node-sql-parser';
import { CanonicalSchema, Table, Column, ForeignKey } from '../types';

export function parseSql(sql: string): CanonicalSchema {
  const cleaned = preprocessSql(sql);
  const parser = new Parser();
  const databases = detectDialectOrder(cleaned);
  const tableMap = new Map<string, Table>();

  // Split into individual statements for resilient parsing
  const rawStatements = cleaned.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const raw of rawStatements) {
    const stmtSql = raw + ';';
    let ast: any = null;

    for (const db of databases) {
      try {
        ast = parser.astify(stmtSql, { database: db });
        break;
      } catch {
        // Try next dialect
      }
    }

    if (!ast) { continue; } // Skip unparseable statements

    const stmts = Array.isArray(ast) ? ast : [ast];
    for (const stmt of stmts) {
      if (stmt.type === 'create' && stmt.keyword === 'table') {
        processCreateTable(stmt, tableMap);
      } else if (stmt.type === 'alter') {
        processAlterTable(stmt, tableMap);
      }
    }
  }

  if (tableMap.size === 0) {
    throw new Error('SQL parse error: no tables could be parsed from the input');
  }

  return { tables: Array.from(tableMap.values()) };
}

/** Detect whether to try PostgreSQL or MySQL first based on syntax hints. */
function detectDialectOrder(sql: string): string[] {
  const upper = sql.toUpperCase();
  const pgHints = /CREATE\s+EXTENSION|UUID_GENERATE|SERIAL|BIGSERIAL|JSONB|TIMESTAMPTZ|BOOLEAN\b|TEXT\b(?!\s+NOT)|BYTEA|::/.test(upper);
  return pgHints ? ['PostgreSQL', 'MySQL'] : ['MySQL', 'PostgreSQL'];
}

/**
 * Strip SQL constructs unsupported by node-sql-parser before parsing.
 * Currently removes CHECK constraints (not needed for ERD generation).
 */
function preprocessSql(sql: string): string {
  let result = '';
  let i = 0;

  while (i < sql.length) {
    // Skip over string literals to avoid matching CHECK inside strings
    if (sql[i] === '\'') {
      result += sql[i++];
      while (i < sql.length) {
        result += sql[i];
        if (sql[i] === '\'' && sql[i + 1] !== '\'') { i++; break; }
        if (sql[i] === '\'' && sql[i + 1] === '\'') { result += sql[++i]; } // escaped quote
        i++;
      }
      continue;
    }

    // Match CHECK keyword
    const remaining = sql.substring(i);
    const checkMatch = remaining.match(/^CHECK\s*\(/i);
    if (checkMatch) {
      // Skip past the balanced parentheses of CHECK(...)
      let pos = i + checkMatch[0].length - 1; // at '('
      let depth = 1;
      pos++;
      while (pos < sql.length && depth > 0) {
        if (sql[pos] === '\'') {
          pos++;
          while (pos < sql.length && !(sql[pos] === '\'' && sql[pos + 1] !== '\'')) {
            if (sql[pos] === '\'' && sql[pos + 1] === '\'') { pos++; }
            pos++;
          }
          pos++; // skip closing quote
          continue;
        }
        if (sql[pos] === '(') { depth++; }
        else if (sql[pos] === ')') { depth--; }
        pos++;
      }
      // Just remove the CHECK(...) text; comma cleanup happens below
      i = pos;
      continue;
    }

    result += sql[i];
    i++;
  }

  // Clean up comma artifacts from removed CHECK constraints
  result = result.replace(/,\s*,/g, ',');       // double commas
  result = result.replace(/,\s*\)/g, ')');       // trailing comma before )
  result = result.replace(/\(\s*,/g, '(');       // leading comma after (

  return result;
}

function processCreateTable(stmt: any, tableMap: Map<string, Table>): void {
  const tableName = extractTableName(stmt.table);
  if (!tableName) { return; }

  const columns: Column[] = [];
  const foreignKeys: ForeignKey[] = [];
  const primaryKeyCols = new Set<string>();
  const uniqueCols = new Set<string>();

  const definitions = stmt.create_definitions || [];

  // First pass: collect constraint-level PK/UNIQUE/FK
  for (const def of definitions) {
    if (def.resource === 'constraint' || def.constraint_type) {
      const ctype = (def.constraint_type || '').toUpperCase();
      if (ctype === 'PRIMARY KEY' || ctype.includes('PRIMARY')) {
        const keyCols = extractConstraintColumns(def);
        keyCols.forEach((c: string) => primaryKeyCols.add(c));
      } else if (ctype === 'UNIQUE' || ctype.includes('UNIQUE')) {
        const keyCols = extractConstraintColumns(def);
        keyCols.forEach((c: string) => uniqueCols.add(c));
      } else if (ctype === 'FOREIGN KEY' || ctype.includes('FOREIGN')) {
        const fks = extractForeignKey(def);
        foreignKeys.push(...fks);
      }
    }
  }

  // Second pass: columns
  for (const def of definitions) {
    if (def.resource === 'column' || def.column) {
      const col = extractColumn(def, primaryKeyCols, uniqueCols);
      if (col) {
        columns.push(col);
        // Check inline foreign key references
        const inlineFk = extractInlineForeignKey(def, col.name);
        if (inlineFk) {
          foreignKeys.push(inlineFk);
        }
      }
    }
  }

  tableMap.set(tableName, { name: tableName, columns, foreignKeys });
}

function processAlterTable(stmt: any, tableMap: Map<string, Table>): void {
  const tableName = extractTableName(stmt.table);
  if (!tableName) { return; }

  let table = tableMap.get(tableName);
  if (!table) {
    table = { name: tableName, columns: [], foreignKeys: [] };
    tableMap.set(tableName, table);
  }

  const exprs = stmt.expr || [];
  const exprList = Array.isArray(exprs) ? exprs : [exprs];

  for (const expr of exprList) {
    const action = (expr.action || '').toUpperCase();
    const resourceType = (expr.resource || '').toUpperCase();

    if (action === 'ADD') {
      if (resourceType === 'CONSTRAINT' || expr.constraint_type) {
        const ctype = (expr.constraint_type || '').toUpperCase();
        if (ctype.includes('FOREIGN')) {
          const fks = extractForeignKey(expr);
          table.foreignKeys.push(...fks);
        }
      }
    }
  }
}

function extractTableName(tableRef: any): string | null {
  if (!tableRef) { return null; }
  if (typeof tableRef === 'string') { return tableRef; }
  if (Array.isArray(tableRef) && tableRef.length > 0) {
    return tableRef[0].table || tableRef[0].name || null;
  }
  return tableRef.table || tableRef.name || null;
}

function extractColumn(
  def: any,
  primaryKeyCols: Set<string>,
  uniqueCols: Set<string>
): Column | null {
  const colName = def.column?.column || def.column?.name || def.column;
  if (!colName || typeof colName !== 'string') { return null; }

  const dataType = extractDataType(def.definition || def);
  let nullable = true;
  let isPrimaryKey = primaryKeyCols.has(colName);
  let isUnique = uniqueCols.has(colName);
  let defaultVal: string | undefined;

  // Check inline constraints
  if (def.nullable) {
    const nv = def.nullable.value;
    if (nv === 'not null') { nullable = false; }
    else if (nv === 'null') { nullable = true; }
  }

  if (def.primary_key) { isPrimaryKey = true; }
  if (def.unique) { isUnique = true; }

  // Check definition-level constraints
  const defObj = def.definition;
  if (defObj) {
    if (defObj.nullable) {
      const nv = defObj.nullable.value;
      if (nv === 'not null') { nullable = false; }
    }
    if (defObj.primary_key) { isPrimaryKey = true; }
    if (defObj.unique) { isUnique = true; }
  }

  // Check constraint attribute from node-sql-parser
  if (def.constraint) {
    if (typeof def.constraint === 'string') {
      const cu = def.constraint.toUpperCase();
      if (cu.includes('PRIMARY')) { isPrimaryKey = true; }
      if (cu.includes('NOT NULL')) { nullable = false; }
      if (cu.includes('UNIQUE')) { isUnique = true; }
    }
  }

  // PK implies not null
  if (isPrimaryKey) { nullable = false; }

  // Default value
  if (def.default_val?.value?.value !== undefined) {
    defaultVal = String(def.default_val.value.value);
  }

  return {
    name: colName,
    type: dataType,
    nullable,
    primaryKey: isPrimaryKey,
    unique: isUnique,
    default: defaultVal,
  };
}

function extractDataType(def: any): string {
  if (!def) { return 'UNKNOWN'; }
  if (def.dataType) {
    let type = def.dataType.toUpperCase();
    if (def.length !== undefined && def.length !== null) {
      type += `(${def.length})`;
    }
    return type;
  }
  return 'UNKNOWN';
}

function extractConstraintColumns(def: any): string[] {
  const cols: string[] = [];
  const definitions = def.definition || def.columns || [];
  const defList = Array.isArray(definitions) ? definitions : [definitions];
  for (const d of defList) {
    if (typeof d === 'string') {
      cols.push(d);
    } else if (d.column) {
      const c = typeof d.column === 'string' ? d.column : d.column.column || d.column.name;
      if (c) { cols.push(c); }
    }
  }
  return cols;
}

function extractForeignKey(def: any): ForeignKey[] {
  const fks: ForeignKey[] = [];
  const sourceCols = extractConstraintColumns(def);
  const refTable = extractTableName(def.reference_definition?.table);
  const refCols = extractConstraintColumns(def.reference_definition || {});

  for (let i = 0; i < sourceCols.length; i++) {
    fks.push({
      column: sourceCols[i],
      referencesTable: refTable || 'UNKNOWN',
      referencesColumn: refCols[i] || refCols[0] || 'UNKNOWN',
    });
  }
  return fks;
}

function extractInlineForeignKey(def: any, colName: string): ForeignKey | null {
  const refDef = def.reference_definition || def.definition?.reference_definition;
  if (!refDef) { return null; }
  const refTable = extractTableName(refDef.table);
  const refCols = extractConstraintColumns(refDef);
  if (refTable) {
    return {
      column: colName,
      referencesTable: refTable,
      referencesColumn: refCols[0] || 'id',
    };
  }
  return null;
}
