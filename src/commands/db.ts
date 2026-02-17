import { Args, Command, Options } from "@effect/cli"
import { Console, Effect } from "effect"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

import { makeDuckDbLayer } from "../db/DuckDb.js"
import { DuckDb } from "../db/DuckDb.js"
import { DEFAULT_DB_PATH } from "../main/shared.js"

const dbOption = Options.text("db").pipe(
    Options.withAlias("d"),
    Options.withDefault(DEFAULT_DB_PATH),
    Options.withDescription(`Path to database file (default: ${DEFAULT_DB_PATH})`),
)

const file = Args.text({ name: "file" })

const dbQuery = Command.make(
    "query",
    { file, db: dbOption },
    ({ file, db }) =>
        Effect.gen(function* () {
            const sqlFilePath = resolve(file)
            if (!existsSync(sqlFilePath)) {
                yield* Effect.fail(new Error(`SQL file not found: ${sqlFilePath}`))
            }
            yield* Console.log(`Running query from: ${sqlFilePath}`)
            yield* Console.log(`Using database: ${db}`)
            const duckDb = yield* DuckDb
            const results = yield* duckDb.queryFile(sqlFilePath)
            if (results.length === 0) {
                yield* Console.log("No results returned")
            } else {
                yield* Console.log(JSON.stringify(results, null, 2))
            }
        }).pipe(Effect.provide(makeDuckDbLayer(db))),
)

const dbExecute = Command.make(
    "execute",
    { file, db: dbOption },
    ({ file, db }) =>
        Effect.gen(function* () {
            const sqlFilePath = resolve(file)
            if (!existsSync(sqlFilePath)) {
                yield* Effect.fail(new Error(`SQL file not found: ${sqlFilePath}`))
            }
            yield* Console.log(`Executing SQL file: ${sqlFilePath}`)
            yield* Console.log(`Using database: ${db}`)
            const duckDb = yield* DuckDb
            yield* duckDb.executeSQLFile(sqlFilePath)
            yield* Console.log("SQL file executed successfully")
        }).pipe(Effect.provide(makeDuckDbLayer(db))),
)

export const dbCmd = Command.make("db").pipe(
    Command.withSubcommands([dbQuery, dbExecute]),
)
