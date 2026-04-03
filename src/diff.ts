import { CanonicalSchema, SchemaDiff, TableDiff, ColumnDiff, ForeignKey } from './types';

export function diffSchemas(base: CanonicalSchema, head: CanonicalSchema): SchemaDiff {
  const baseTables = new Map(base.tables.map(t => [t.name, t]));
  const headTables = new Map(head.tables.map(t => [t.name, t]));

  const tableDiffs: TableDiff[] = [];

  // Check for removed and modified tables
  for (const [name, baseTable] of baseTables) {
    const headTable = headTables.get(name);
    if (!headTable) {
      // Table was removed
      tableDiffs.push({
        name,
        status: 'removed',
        columns: baseTable.columns.map(col => ({
          name: col.name,
          status: 'removed' as const,
          column: col,
        })),
        foreignKeys: baseTable.foreignKeys,
      });
    } else {
      // Table exists in both — check for column changes
      const columnDiffs = diffColumns(baseTable.columns, headTable.columns);
      const hasChanges = columnDiffs.some(c => c.status !== 'unchanged');
      const fkChanged = !areForeignKeysEqual(baseTable.foreignKeys, headTable.foreignKeys);

      tableDiffs.push({
        name,
        status: hasChanges || fkChanged ? 'modified' : 'unchanged',
        columns: columnDiffs,
        foreignKeys: headTable.foreignKeys,
      });
    }
  }

  // Check for new tables
  for (const [name, headTable] of headTables) {
    if (!baseTables.has(name)) {
      tableDiffs.push({
        name,
        status: 'added',
        columns: headTable.columns.map(col => ({
          name: col.name,
          status: 'added' as const,
          column: col,
        })),
        foreignKeys: headTable.foreignKeys,
      });
    }
  }

  return { tables: tableDiffs };
}

function diffColumns(
  baseCols: CanonicalSchema['tables'][0]['columns'],
  headCols: CanonicalSchema['tables'][0]['columns']
): ColumnDiff[] {
  const baseMap = new Map(baseCols.map(c => [c.name, c]));
  const headMap = new Map(headCols.map(c => [c.name, c]));
  const diffs: ColumnDiff[] = [];

  // Removed columns
  for (const [name, col] of baseMap) {
    if (!headMap.has(name)) {
      diffs.push({ name, status: 'removed', column: col });
    }
  }

  // Added and unchanged columns
  for (const [name, col] of headMap) {
    if (!baseMap.has(name)) {
      diffs.push({ name, status: 'added', column: col });
    } else {
      diffs.push({ name, status: 'unchanged', column: col });
    }
  }

  return diffs;
}

function areForeignKeysEqual(a: ForeignKey[], b: ForeignKey[]): boolean {
  if (a.length !== b.length) { return false; }
  const sortFn = (x: ForeignKey, y: ForeignKey) => x.column.localeCompare(y.column);
  const sortedA = [...a].sort(sortFn);
  const sortedB = [...b].sort(sortFn);
  return sortedA.every((fk, i) =>
    fk.column === sortedB[i].column &&
    fk.referencesTable === sortedB[i].referencesTable &&
    fk.referencesColumn === sortedB[i].referencesColumn
  );
}
