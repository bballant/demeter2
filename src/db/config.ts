import { Effect } from "effect"

import type { Config } from "../main/types.js"

import { DuckDb } from "./DuckDb.js"
import { DatabaseError } from "./errors.js"

export const getConfigValue = (key: string): Effect.Effect<string | null, DatabaseError, DuckDb> =>
    Effect.gen(function* () {
        const db = yield* DuckDb
        const results = yield* db.query<{ value: string }>("SELECT value FROM config WHERE key = ?", [key])
        return results.length === 0 ? null : results[0].value
    })

export const setConfigValue = (key: string, value: string): Effect.Effect<void, DatabaseError, DuckDb> =>
    Effect.gen(function* () {
        const db = yield* DuckDb
        yield* db.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", [key, value])
    })

export const unsetConfigValue = (key: string): Effect.Effect<void, DatabaseError, DuckDb> =>
    Effect.gen(function* () {
        const db = yield* DuckDb
        yield* db.execute("DELETE FROM config WHERE key = ?", [key])
    })

export const getAllConfigValues = (): Effect.Effect<Config, DatabaseError, DuckDb> =>
    Effect.gen(function* () {
        const db = yield* DuckDb
        const results = yield* db.query<{ key: string; value: string }>("SELECT key, value FROM config")
        const configMap: Config = {}
        for (const row of results) {
            configMap[row.key] = row.value
        }
        return configMap
    })
