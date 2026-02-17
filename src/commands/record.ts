import { Args, Command, Options } from "@effect/cli"
import { Console, Effect } from "effect"
import { parse } from "csv-parse/sync"
import { mkdirSync, readFileSync } from "node:fs"
import { basename, dirname, resolve } from "node:path"

import { insertRecords } from "../db/record.js"
import type { StatementRecord } from "../db/model.js"
import { makeDuckDbLayer } from "../db/DuckDb.js"
import { DEFAULT_DB_PATH } from "../main/shared.js"

/**
 * Maps normalized CSV column names to record fields.
 * Add entries here to support more column names; the code picks them up automatically.
 * Normalization: lowercase and trim (applied when matching headers).
 */
const CSV_COLUMN_TO_RECORD_FIELD: Record<string, keyof StatementRecord> = {
    memo: "id",
    date: "date",
    transaction: "record_type",
    name: "description",
    amount: "amount",
}

const normalize = (s: string): string => s.toLowerCase().trim()

const REQUIRED_FIELDS: (keyof StatementRecord)[] = ["id", "date", "record_type", "amount", "description", "source_file"]

function mapRowToRecord(csvRow: Record<string, string>, sourceFile: string): StatementRecord | null {
    const partial: Record<string, string | number> = {}
    for (const [csvCol, value] of Object.entries(csvRow)) {
        const field = CSV_COLUMN_TO_RECORD_FIELD[normalize(csvCol)]
        if (field) partial[field] = value
    }
    partial.source_file = sourceFile

    if (!REQUIRED_FIELDS.every((f) => f in partial && partial[f] !== "")) return null

    const amount = Number(partial.amount)
    if (Number.isNaN(amount)) return null

    const recordType = String(partial.record_type).toUpperCase()
    if (recordType !== "CREDIT" && recordType !== "DEBIT") return null

    return {
        id: String(partial.id).trim(),
        date: String(partial.date).trim(),
        record_type: recordType as "CREDIT" | "DEBIT",
        amount,
        description: String(partial.description).trim(),
        source_file: sourceFile,
    }
}

const dbOption = Options.text("db").pipe(
    Options.withAlias("d"),
    Options.withDefault(DEFAULT_DB_PATH),
    Options.withDescription(`Path to database file (default: ${DEFAULT_DB_PATH})`),
)

const fileArg = Args.file({ name: "file", exists: "yes" })

const ingestFile = Command.make(
    "ingest-file",
    { file: fileArg, db: dbOption },
    ({ file, db }) =>
        Effect.gen(function* () {
            mkdirSync(dirname(db), { recursive: true })
            const csvPath = resolve(file)
            const sourceFile = basename(csvPath)
            const raw = readFileSync(csvPath, "utf8")
            const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[]
            const records: StatementRecord[] = []
            for (const row of rows) {
                const record = mapRowToRecord(row, sourceFile)
                if (record) records.push(record)
            }
            if (records.length === 0) {
                yield* Console.log("No records to ingest (or no rows matched the column mapping)")
                return
            }
            yield* insertRecords(records)
            yield* Console.log(`Ingested ${records.length} record(s) from ${sourceFile}`)
        }).pipe(Effect.provide(makeDuckDbLayer(db))),
)

export const recordCmd = Command.make("record").pipe(
    Command.withSubcommands([ingestFile]),
)
