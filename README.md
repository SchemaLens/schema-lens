# Schema Lens

**Instant ERD diagrams from your SQL, Prisma, Drizzle, and Knex migrations. No database connection required.**

<!-- DEMO GIF — replace this comment with your GIF once uploaded to the repo -->
<!-- ![Schema Lens demo](images/demo.gif) -->

Open your migration file → click **≋ Schema Lens Icon** → live diagram updates as you edit. Vibe-coded in public, AGPLv3 licensed.

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=SangeethPromod.schema-lens) | [GitHub](https://github.com/sangeethPromod/schema-lens)

[![ko-fi](https://storage.ko-fi.com/cdn/kofi_stroke_cup_button.png)](https://ko-fi.com/T6T41XAD01)

---

## The Problem

You get handed `schema.sql`, `schema.prisma`, or `2024_init.ts`.

- No ERD exists
- No database to connect to
- Your brain has to reconstruct relationships manually
- Code reviews take 3× longer
- Onboarding new devs = pain

## The Fix

1. Open any migration file (`.sql`, `.prisma`, Drizzle `schema.ts`, Knex migrations)
2. Click **≋ ERD** in the editor title bar
3. Live, interactive ERD appears in a side panel
4. Edit the file → diagram updates instantly on save

**No database. No cloud. Just your files.**

---

## See It Work

<!-- Paste your GIF here: editor → ERD button → diagram renders → edit → live update -->
<!-- Recommended: record with Kap or Recordit, keep under 10 MB, host on GitHub -->

| Format | Example |
|--------|---------|
| Raw SQL | `CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE)` |
| Prisma | `model User { id Int @id @default(autoincrement()) email String @unique }` |
| Drizzle | `pgTable('users', { id: serial('id').primaryKey(), email: text('email').notNull().unique() })` |
| Knex | `table.increments('id'); table.string('email').unique()` |

---

## Install

**Option 1 — Marketplace UI**
1. Open VS Code Extensions (`Ctrl+Shift+X`)
2. Search **Schema Lens**
3. Click Install

**Option 2 — CLI**
```bash
code --install-extension SangeethPromod.schema-lens
```

**Option 3 — Direct link**
[marketplace.visualstudio.com → Schema Lens](https://marketplace.visualstudio.com/items?itemName=SangeethPromod.schema-lens)

Open any `.sql` / `.prisma` / Drizzle / Knex file → the **≋ ERD** button appears automatically in the title bar.

**Works offline after install.**

---

## Usage

### Open an ERD
1. Open a supported schema file
2. Click **≋ Schema Lens** in the editor title bar, or run **Schema Lens: Open ERD** from the Command Palette (`Ctrl+Shift+P`)
3. ERD opens in a side panel — zoom with scroll wheel, pan by click-dragging

### Diff Mode (Beta, may run into edge case issues)
Compare two schema files visually:
1. Open a schema file
2. Run **Schema Lens: Compare With…** from the Command Palette
3. Select a second file
4. Diff ERD opens with:
   - 🟢 Added tables and columns
   - 🔴 Removed tables and columns
   - 🟡 Modified tables

---

## Supported Formats

| Format | File Pattern | How It's Parsed |
|--------|-------------|-----------------|
| Raw SQL | `*.sql` | `node-sql-parser` — `CREATE TABLE`, `ALTER TABLE`, `FOREIGN KEY` |
| Prisma | `schema.prisma` | Line-based parser — `model` blocks, fields, `@relation` |
| Drizzle | `*.ts` with `pgTable` / `mysqlTable` / `sqliteTable` | TypeScript AST walk |
| Knex.js | `*.ts` with `createTable` | TypeScript AST walk |

Auto-detection for `.ts` files: Drizzle is preferred if both patterns are present.

---

## Known Limitations

- **SQL dialects** — targets PostgreSQL and MySQL. Vendor-specific syntax (e.g., SQL Server `IDENTITY`) may not parse cleanly.
- **Prisma enums** — `enum` blocks are ignored; they won't appear in the ERD.
- **Composite foreign keys** — fully supported in SQL; ORM parsers handle common patterns, complex composites may not render perfectly.
- **Views, procedures, functions** — not parsed; not shown.
- **Large schemas** — 50+ tables can feel heavy. Zoom and pan to navigate.
- **Block comments** — `/* ... */` inside `CREATE TABLE` definitions can confuse the parser in some edge cases.

**Always verify generated ERDs against your actual schema.**

---

## Pre-1.0: Vibe-Coded with Guardrails

Built fast, shipped fast, learning in public.

- Tests + CI on every PR
- AGPLv3: use it freely, improve it, share improvements back
- Rough edges expected — file issues, send PRs

This is not production-hardened tooling. It is a dev utility that solves a real problem. Use accordingly.

---

## Contribute

```bash
git clone https://github.com/sangeethPromod/schema-lens
cd schema-lens
npm install
npm test
```

1. Fork → branch → PR to `main`
2. `npm test` must pass before pushing
3. Good first issues: [labeled here](https://github.com/sangeethPromod/schema-lens/labels/good%20first%20issue)

**Wanted contributions:**
- Parser bug fixes for your ORM / SQL dialect
- MongoDB / Mongoose support
- ERD diff view between migration versions
- Better dark mode theming
- Performance improvements for large schemas

---

[![AGPL License](https://img.shields.io/github/license/sangeethPromod/schema-lens)](LICENSE)
[![Issues](https://img.shields.io/github/issues/sangeethPromod/schema-lens)](https://github.com/sangeethPromod/schema-lens/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/sangeethPromod/schema-lens)](https://github.com/sangeethPromod/schema-lens/pulls)

Schema Lens is licensed under the [GNU Affero General Public License v3.0](LICENSE).
Copyright (C) 2026 Sangeeth Promod

**Built in Kerala. Vibe-coded for developers everywhere.**
