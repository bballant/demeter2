import { Effect } from "effect"

import type { StatementRecord } from "./model.js"
import { DuckDb } from "./DuckDb.js"
import { DatabaseError } from "./errors.js"

const INSERT_SQL = `
INSERT OR REPLACE INTO record (id, date, record_type, amount, description, source_file)
VALUES (?, ?, ?, ?, ?, ?)
`

export const runMigrations = Effect.gen(function* () {
    const db = yield* DuckDb
    const migrationsPath = new URL("../sql/migrations-up.sql", import.meta.url).pathname
    yield* db.executeSQLFile(migrationsPath)
})

/** Insert records without running migrations (caller must ensure schema exists). */
export const insertRecordsOnly = (records: StatementRecord[]): Effect.Effect<void, DatabaseError, DuckDb> =>
    Effect.gen(function* () {
        const db = yield* DuckDb
        for (const record of records) {
            yield* db.execute(INSERT_SQL, [
                record.id,
                record.date,
                record.record_type,
                record.amount,
                record.description,
                record.source_file,
            ])
        }
    })

export const insertRecords = (records: StatementRecord[]): Effect.Effect<void, DatabaseError, DuckDb> =>
    Effect.gen(function* () {
        yield* runMigrations
        yield* insertRecordsOnly(records)
    })
