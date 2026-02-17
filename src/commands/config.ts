import { Args, Command, Options } from "@effect/cli"
import { Console, Effect } from "effect"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

import { getAllConfigValues, getConfigValue, setConfigValue, unsetConfigValue } from "../db/config.js"
import { DuckDb, makeDuckDbLayer } from "../db/DuckDb.js"
import { DEFAULT_DB_PATH } from "../main/shared.js"

const dbOption = Options.text("db").pipe(
    Options.withAlias("d"),
    Options.withDefault(DEFAULT_DB_PATH),
    Options.withDescription(`Path to database file (default: ${DEFAULT_DB_PATH})`),
)

const key = Args.text({ name: "key" })
const value = Args.text({ name: "value" })

const runMigrations = Effect.gen(function* () {
    const db = yield* DuckDb
    const migrationsPath = new URL("../sql/migrations-up.sql", import.meta.url).pathname
    yield* db.executeSQLFile(migrationsPath)
})

const configSet = Command.make(
    "set",
    { key, value, db: dbOption },
    ({ key, value, db }) =>
        Effect.gen(function* () {
            mkdirSync(dirname(db), { recursive: true })
            yield* runMigrations
            yield* setConfigValue(key, value)
            yield* Console.log(`Set ${key} = ${value}`)
        }).pipe(Effect.provide(makeDuckDbLayer(db))),
)

const configGet = Command.make(
    "get",
    { key, db: dbOption },
    ({ key, db }) =>
        Effect.gen(function* () {
            const result = yield* getConfigValue(key)
            if (result === null) {
                yield* Console.log(`${key} is not set`)
            } else {
                yield* Console.log(result)
            }
        }).pipe(Effect.provide(makeDuckDbLayer(db))),
)

const configUnset = Command.make(
    "unset",
    { key, db: dbOption },
    ({ key, db }) =>
        Effect.gen(function* () {
            yield* unsetConfigValue(key)
            yield* Console.log(`Removed ${key}`)
        }).pipe(Effect.provide(makeDuckDbLayer(db))),
)

const configShow = Command.make(
    "show",
    { db: dbOption },
    ({ db }) =>
        Effect.gen(function* () {
            const config = yield* getAllConfigValues()
            const keys = Object.keys(config)
            if (keys.length === 0) {
                yield* Console.log("No config values set")
                return
            }
            for (const k of keys.sort()) {
                const val = k.toLowerCase().includes("key") || k.toLowerCase().includes("secret")
                    ? "********"
                    : config[k]
                yield* Console.log(`${k} = ${val}`)
            }
        }).pipe(Effect.provide(makeDuckDbLayer(db))),
)

export const configCmd = Command.make("config").pipe(
    Command.withSubcommands([configSet, configGet, configUnset, configShow]),
)
