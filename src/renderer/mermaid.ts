import { CanonicalSchema, SchemaDiff } from '../types';

export function schemaToMermaid(schema: CanonicalSchema): string {
  const lines: string[] = ['erDiagram'];

  for (const table of schema.tables) {
    lines.push(`  ${sanitizeName(table.name)} {`);
    for (const col of table.columns) {
      const markers: string[] = [];
      if (col.primaryKey) { markers.push('PK'); }
      const isFk = table.foreignKeys.some(fk => fk.column === col.name);
      if (isFk) { markers.push('FK'); }
      if (col.unique && !col.primaryKey) { markers.push('UK'); }
      const markerStr = markers.length > 0 ? ` ${markers.join(',')}` : '';
      const colType = sanitizeType(col.type);
      const comment = col.nullable ? '"nullable"' : '';
      lines.push(`    ${colType} ${sanitizeName(col.name)}${markerStr} ${comment}`.trimEnd());
    }
    lines.push('  }');
  }

  // Relationship lines
  for (const table of schema.tables) {
    for (const fk of table.foreignKeys) {
      const from = sanitizeName(fk.referencesTable);
      const to = sanitizeName(table.name);
      lines.push(`  ${from} ||--o{ ${to} : "has"`);
    }
  }

  return lines.join('\n');
}

export function diffSchemaToMermaid(diff: SchemaDiff): string {
  const lines: string[] = ['erDiagram'];

  for (const table of diff.tables) {
    let tableName = sanitizeName(table.name);
    if (table.status === 'removed') {
      tableName = `${tableName}___DROPPED`;
    }

    lines.push(`  ${tableName} {`);

    if (table.columns) {
      for (const colDiff of table.columns) {
        if (!colDiff.column) { continue; }
        const col = colDiff.column;
        const markers: string[] = [];
        if (col.primaryKey) { markers.push('PK'); }
        const isFk = table.foreignKeys.some(fk => fk.column === col.name);
        if (isFk) { markers.push('FK'); }
        const markerStr = markers.length > 0 ? ` ${markers.join(',')}` : '';
        const colType = sanitizeType(col.type);
        let comment = '';
        if (colDiff.status === 'added') { comment = '"[+added]"'; }
        else if (colDiff.status === 'removed') { comment = '"[-removed]"'; }
        lines.push(`    ${colType} ${sanitizeName(col.name)}${markerStr} ${comment}`.trimEnd());
      }
    }
    lines.push('  }');
  }

  // Relationships from non-removed tables
  for (const table of diff.tables) {
    if (table.status === 'removed') { continue; }
    for (const fk of table.foreignKeys) {
      const from = sanitizeName(fk.referencesTable);
      const to = sanitizeName(table.name);
      lines.push(`  ${from} ||--o{ ${to} : "has"`);
    }
  }

  return lines.join('\n');
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

function sanitizeType(type: string): string {
  return type.replace(/[^a-zA-Z0-9_()]/g, '_');
}
