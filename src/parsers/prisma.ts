import { CanonicalSchema } from '../types';

const PRISMA_TYPE_MAP: Record<string, string> = {
  'String': 'VARCHAR(255)',
  'Int': 'INT',
  'BigInt': 'BIGINT',
  'Float': 'FLOAT',
  'Decimal': 'DECIMAL',
  'Boolean': 'BOOLEAN',
  'DateTime': 'TIMESTAMP',
  'Json': 'JSON',
  'Bytes': 'BLOB',
};

export function parsePrisma(content: string): CanonicalSchema {
  const tables: CanonicalSchema['tables'] = [];
  const lines = content.split('\n');

  let currentModel: string | null = null;
  let currentColumns: CanonicalSchema['tables'][0]['columns'] = [];
  let currentForeignKeys: CanonicalSchema['tables'][0]['foreignKeys'] = [];
  let braceDepth = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Detect model block start
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = modelMatch[1];
      currentColumns = [];
      currentForeignKeys = [];
      braceDepth = 1;
      continue;
    }

    if (currentModel === null) { continue; }

    // Track braces
    if (line === '{') { braceDepth++; continue; }
    if (line === '}' || line.startsWith('}')) {
      braceDepth--;
      if (braceDepth <= 0) {
        tables.push({
          name: currentModel,
          columns: currentColumns,
          foreignKeys: currentForeignKeys,
        });
        currentModel = null;
        currentColumns = [];
        currentForeignKeys = [];
      }
      continue;
    }

    // Skip blank lines, comments, and @@-level attributes
    if (!line || line.startsWith('//') || line.startsWith('@@')) { continue; }

    // Parse field line
    parseFieldLine(line, currentColumns, currentForeignKeys);
  }

  return { tables };
}

function parseFieldLine(
  line: string,
  columns: CanonicalSchema['tables'][0]['columns'],
  foreignKeys: CanonicalSchema['tables'][0]['foreignKeys']
): void {
  // Field pattern: fieldName  FieldType?  @decorators...
  const fieldMatch = line.match(/^(\w+)\s+(\w+)(\?)?(\[\])?\s*(.*)?$/);
  if (!fieldMatch) { return; }

  const [, fieldName, fieldType, nullable, isArray, rest = ''] = fieldMatch;

  // Skip relation fields (type is another model name and has @relation)
  if (rest.includes('@relation')) {
    // Extract foreign key info from @relation
    const relationMatch = rest.match(/@relation\(\s*(?:name:\s*"[^"]*",?\s*)?fields:\s*\[([^\]]+)\],?\s*references:\s*\[([^\]]+)\]/);
    if (relationMatch) {
      const fields = relationMatch[1].split(',').map(s => s.trim());
      const references = relationMatch[2].split(',').map(s => s.trim());
      for (let i = 0; i < fields.length; i++) {
        foreignKeys.push({
          column: fields[i],
          referencesTable: fieldType,
          referencesColumn: references[i] || references[0],
        });
      }
    }
    return;
  }

  // Skip array relation fields (e.g., posts Post[])
  if (isArray) { return; }

  const isPrimaryKey = rest.includes('@id');
  const isUnique = rest.includes('@unique');
  const isNullable = nullable === '?';

  let defaultVal: string | undefined;
  const defaultMatch = rest.match(/@default\(([^)]+)\)/);
  if (defaultMatch) {
    defaultVal = defaultMatch[1];
  }

  const sqlType = PRISMA_TYPE_MAP[fieldType] || fieldType.toUpperCase();

  columns.push({
    name: fieldName,
    type: sqlType,
    nullable: isNullable,
    primaryKey: isPrimaryKey,
    unique: isUnique,
    default: defaultVal,
  });
}
