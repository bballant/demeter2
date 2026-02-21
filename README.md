# Demeter2

A **command-line budgeting app** that stores bank/statement data in an embedded **DuckDB** database, tags transactions by category, and produces **spending reports** (text or one-page PDF).

## Requirements

- **Node.js 25+** (see `package.json` `engines`)
- [mise](https://mise.jdx.dev/) (optional, for version management)

## Quick Start

```bash
npm install
npm run build
./bin/run.js --help
```

Default database path: `~/.local/share/demeter2/demeter2.db`.

---

## Commands

### Config (key-value store in the DB)

```bash
demeter2 config set <key> <value>
demeter2 config get <key>
demeter2 config unset <key>
demeter2 config show
```

### Database (run SQL files)

```bash
demeter2 db query <file>     # Run query, print JSON to stdout
demeter2 db execute <file>   # Execute SQL (e.g. migrations, seed data)
```

Use `-d` / `--db <path>` to override the database file.

### Records (ingest CSV transactions)

```bash
demeter2 record ingest-file <csv-path> [--db <path>]
```

Imports rows from a CSV; column names are normalized and mapped to `id`, `date`, `record_type`, `amount`, `description`, and `source_file`. See `src/commands/record.ts` for the column mapping.

### Report (spending summary)

```bash
demeter2 report                    # Text report to stdout (default)
demeter2 report -o pdf             # One-page PDF to ./report.pdf
demeter2 report -o pdf --out path  # PDF to a specific path
demeter2 report -d /path/to/db     # Use a different database
```

The report shows, for **recent month**, **avg monthly**, and **recent year** (based on the latest date in the data):

- Top 12 categories by spend  
- Top 12 transactions by spend (recent month and recent year only)  
- Top 12 merchants by spend  

Output formats:

- **stdout:** Plain text, suitable for terminals or piping.  
- **PDF:** Single page with header “Budget Report &lt;date&gt;”, three sections (one per period), tables with borders, and an optional logo image (`demeter2.png`) centered near the bottom.

---

## Data Model & Schema

- **`config`** — Key-value store (e.g. app settings).  
- **`record`** — One row per transaction: `id`, `date`, `record_type` (CREDIT/DEBIT), `amount`, `description`, `source_file`.  
- **`tag`** — Category labels (e.g. Groceries, Subscriptions); IDs are fixed in seed SQL.  
- **`record_tag`** — Many-to-many: which record has which tag(s).

Schema is created by running the migration SQL (see `src/sql/migrations-up.sql`). Tags and per-record tagging are populated by `src/sql/seed-tags.sql` (pattern-based rules on `description`). Report data comes from a single query in `src/sql/report.sql`.

---

## Project Layout (for developers and LLMs)

| Path | Purpose |
|------|--------|
| `bin/run.js` | Entrypoint; loads `dist/main.js`. |
| `src/main.ts` | CLI root: wires subcommands and Effect runtime. |
| `src/commands/` | Subcommands: `config`, `db`, `record`, `report`. |
| `src/db/` | DuckDB layer, record insert, errors, **model types** (`model.ts`). |
| `src/report/` | Report logic: build from rows (`buildReport.ts`), output service (**stdout vs PDF**) and one-page PDF layout (`ReportOutput.ts`). |
| `src/sql/` | SQL files: migrations, `seed-tags.sql` (tags + record_tag), `report.sql` (single query for full report). |
| `src/main/shared.ts` | Default data dir and DB path. |

**Important types (in `src/db/model.ts`):** `StatementRecord`, `Tag`, `TaggedRecord`, `ReportPeriod`, `ReportSection`, `ReportRow`, `SpendingReport`. The report query returns flat `ReportRow[]`; `buildReportFromRows()` turns them into a `SpendingReport` used by both text and PDF output.

**Report output:** The `report` command uses an Effect **ReportOutput** service (see `src/report/ReportOutput.ts`). The CLI chooses either a stdout layer or a PDF layer (with output path) and runs the same “build report → write” flow so adding another format (e.g. HTML) only requires a new layer.

**Database:** DuckDB, file-based. Path is configurable per command via `-d` / `--db`; default is `~/.local/share/demeter2/demeter2.db`. No separate server.

---

## SQL Files You Can Run

- **`src/sql/migrations-up.sql`** — Creates `config`, `record`, `tag`, `record_tag`. Run once (e.g. `demeter2 db execute src/sql/migrations-up.sql`).  
- **`src/sql/seed-tags.sql`** — Clears and repopulates `tag` and `record_tag` from pattern rules on `record.description`. Idempotent; safe to re-run.  
- **`src/sql/report.sql`** — One big query that returns all report rows (period, section, rank, category/merchant/transaction fields). Used by `demeter2 report`; you can also run it via `demeter2 db query src/sql/report.sql` to inspect raw rows.

After build, the same files exist under `dist/sql/` and are used by the CLI when resolving the report query path.

---

## Development

```bash
npm test       # Mocha tests + lint
npm run lint   # ESLint
npm run build  # tsc + copy src/sql and demeter2.png to dist
```

- **TypeScript:** Strict, ESM, target ES2022; `moduleResolution: node16`.  
- **Effect:** Used for CLI, DB layer, and report output; commands provide layers (e.g. DuckDb, ReportOutput) and run in the Effect runtime.

---

## Built With

- [Effect](https://effect.website/) — TypeScript effect system
- [DuckDB](https://duckdb.org/) — Embedded analytical database
- [@effect/cli](https://effect-ts.github.io/effect/docs/cli) — CLI framework
- [pdf-lib](https://pdf-lib.js.org/) — PDF generation for reports
- [csv-parse](https://csv.js.org/) — CSV ingestion for records
- TypeScript
