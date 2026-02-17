# Demeter2

A CLI with an embedded DuckDB database, key-value config store, and SQL file execution.

## Requirements

- **Node.js 25+** (required)
- [mise](https://mise.jdx.dev/) (recommended for version management)

## Build & Run

```bash
npm install
npm run build
./bin/run.js --help
```

## Available Commands

```
demeter2 config set <key> <value>   Set a config value
demeter2 config get <key>           Get a config value
demeter2 config unset <key>         Remove a config value
demeter2 config show                Show all config values

demeter2 db query <file>            Run a SQL query file
demeter2 db execute <file>          Execute a SQL file
```

## Development

```bash
npm test
npm run lint
```

## Built With

- [Effect](https://effect.website/) — TypeScript effect system
- [DuckDB](https://duckdb.org/) — Embedded analytical database
- [@effect/cli](https://effect-ts.github.io/effect/docs/cli) — CLI framework
- [TypeScript](https://www.typescriptlang.org/)
