# Schema Lens

> Your schema, in focus. Instant ERD from the files you already write.

<!-- GIF PLACEHOLDER -->

Schema Lens parses your SQL migrations, Prisma schemas, Drizzle schemas, and Knex migrations and renders an interactive ERD directly inside VS Code, with no database connection required.

## Features

- **Interactive ERD in VS Code**  
  Entity-relationship diagrams with zoom and pan in a side panel next to your editor.

- **File-first, multi-format support**  
  Works from the files you already maintain:
  - Raw SQL (`.sql`)
  - Prisma (`schema.prisma`)
  - Drizzle ORM schema files (`pgTable`, `mysqlTable`, `sqliteTable`)
  - Knex.js migration files (`createTable` etc.)

- **Live reload on save**  
  Edit your migration or schema, hit save, and the diagram refreshes automatically.

- **Visual diff mode**  
  Compare two schema files and see:
  - 🟢 Added tables and columns  
  - 🔴 Removed tables and columns  
  - 🟡 Modified tables

- **Respects your theme**  
  Diagram styling follows your VS Code light or dark theme preferences.

## Installation

### From VSIX

1. Download the `.vsix` file from the [Releases](https://github.com/schema-lens/schema-lens/releases) page.
2. In VS Code, open the Extensions view, open the “Views and More Actions…” menu (`…`), and choose **Install from VSIX…**. [web:135]
3. Select the downloaded `.vsix` file and complete the install.

### From Marketplace

1. Open VS Code.
2. Go to **Extensions** (`Ctrl+Shift+X`).
3. Search for **Schema Lens**.
4. Click **Install**.

## Usage

1. Open a supported schema file:
   - SQL: `*.sql`
   - Prisma: `schema.prisma`
   - Drizzle: TypeScript files with `pgTable` / `mysqlTable` / `sqliteTable`
   - Knex: TypeScript migration files with `createTable`
2. Click the **≋ ERD** button in the editor title bar  
   or run **Schema Lens: Open ERD** from the Command Palette (`Ctrl+Shift+P`).
3. The ERD opens in a side panel next to your code.
4. **Zoom** with the scroll wheel, **pan** by clicking and dragging the canvas.
5. Save the file to refresh the diagram with your latest changes.

### Diff Mode

1. Open a schema file.
2. Run **Schema Lens: Compare With…** from the Command Palette.
3. Choose a second schema file to compare.
4. A diff ERD opens showing:
   - 🟢 **Added** tables and columns  
   - 🔴 **Removed** tables and columns  
   - 🟡 **Modified** tables

## Supported Formats

| Format      | File Pattern                     | Parser Approach                               |
|------------|-----------------------------------|-----------------------------------------------|
| Raw SQL    | `*.sql`                           | `node-sql-parser` for `CREATE/ALTER/FOREIGN KEY` |
| Prisma     | `schema.prisma`                   | Line-based parser for `model`, fields, `@relation` |
| Drizzle    | `*.ts` with `pgTable` / `mysqlTable` / `sqliteTable` | TypeScript AST walk                           |
| Knex.js    | `*.ts` with `createTable`         | TypeScript AST walk                           |

## Limitations and Edge Cases

- **Offline-friendly**  
  The ERD webview does not require external network requests.

- **SQL dialect coverage**  
  The SQL parser targets common PostgreSQL and MySQL syntax. Vendor-specific features such as SQL Server `IDENTITY` may fail to parse cleanly.

- **Drizzle and Knex detection**  
  For `.ts` files, Schema Lens auto-detects Drizzle vs Knex based on imports and function calls. If a file mixes both patterns, Drizzle is preferred.

- **Prisma enums**  
  `enum` blocks are currently ignored and do not appear in the ERD.

- **Composite foreign keys**  
  Fully supported in SQL parsing. ORM parsers handle the common patterns but some complex composites may not render perfectly yet.

- **Views and procedures**  
  Views, stored procedures, and functions are not parsed or shown in the diagram.

- **Very large schemas**  
  Diagrams with more than ~50 tables can feel heavy in the panel. Use zoom and pan to navigate large models efficiently.

- **Inline SQL comments**  
  Complex block comments (`/* ... */`) inside `CREATE TABLE` definitions can confuse the SQL parser in some cases.


  ## License
Schema Lens is licensed under the [GNU Affero General Public License v3.0](LICENSE).
Copyright (C) 2026 [Your Name]