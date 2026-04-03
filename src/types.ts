export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  default?: string;
}

export interface ForeignKey {
  column: string;
  referencesTable: string;
  referencesColumn: string;
}

export interface Table {
  name: string;
  columns: Column[];
  foreignKeys: ForeignKey[];
}

export interface CanonicalSchema {
  tables: Table[];
}

export type DiffStatus = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ColumnDiff {
  name: string;
  status: DiffStatus;
  column?: Column;
}

export interface TableDiff {
  name: string;
  status: DiffStatus;
  columns: ColumnDiff[];
  foreignKeys: ForeignKey[];
}

export interface SchemaDiff {
  tables: TableDiff[];
}
