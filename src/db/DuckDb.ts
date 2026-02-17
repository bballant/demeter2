import type { DuckDBValue } from "@duckdb/node-api"

import { DuckDBInstance } from "@duckdb/node-api"
import { Context, Effect, Layer } from "effect"
import { readFileSync } from "node:fs"

import { DatabaseError } from "./errors.js"

export type DuckDb = {
    readonly execute: (sql: string, values?: DuckDBValue[]) => Effect.Effect<void, DatabaseError>
    readonly query: <T = Record<string, unknown>>(sql: string, values?: DuckDBValue[]) => Effect.Effect<T[], DatabaseError>
    readonly executeSQLFile: (filePath: string) => Effect.Effect<void, DatabaseError>
    readonly queryFile: <T = Record<string, unknown>>(filePath: string) => Effect.Effect<T[], DatabaseError>
}

export const DuckDb = Context.GenericTag<DuckDb>("DuckDb")

export const makeDuckDbLayer = (dbFilePath: string): Layer.Layer<DuckDb, DatabaseError> =>
    Layer.scoped(
        DuckDb,
        Effect.gen(function* () {
            const instance = yield* Effect.acquireRelease(
                Effect.tryPromise({
                    try: () => DuckDBInstance.create(dbFilePath),
                    catch: (e) => new DatabaseError({ message: `Failed to open database: ${dbFilePath}`, cause: e }),
                }),
                (inst) =>
                    Effect.sync(() => {
                        try { inst.closeSync() } catch { /* ignore cleanup errors */ }
                    }),
            )

            const connection = yield* Effect.acquireRelease(
                Effect.tryPromise({
                    try: () => instance.connect(),
                    catch: (e) => new DatabaseError({ message: "Failed to connect to database", cause: e }),
                }),
                (conn) =>
                    Effect.sync(() => {
                        try { conn.closeSync() } catch { /* ignore cleanup errors */ }
                    }),
            )

            const execute = (sql: string, values?: DuckDBValue[]): Effect.Effect<void, DatabaseError> =>
                Effect.tryPromise({
                    try: () => connection.run(sql, values),
                    catch: (e) => new DatabaseError({ message: `Failed to execute SQL: ${sql.slice(0, 100)}`, cause: e }),
                })

            const query = <T = Record<string, unknown>>(sql: string, values?: DuckDBValue[]): Effect.Effect<T[], DatabaseError> =>
                Effect.tryPromise({
                    try: async () => {
                        const reader = await connection.runAndReadAll(sql, values)
                        return reader.getRowObjectsJson() as T[]
                    },
                    catch: (e) => new DatabaseError({ message: `Failed to query: ${sql.slice(0, 100)}`, cause: e }),
                })

            const executeSQLFile = (filePath: string): Effect.Effect<void, DatabaseError> =>
                Effect.try({
                    try: () => readFileSync(filePath, "utf8"),
                    catch: (e) => new DatabaseError({ message: `Failed to read SQL file: ${filePath}`, cause: e }),
                }).pipe(Effect.flatMap((sql) => execute(sql)))

            const queryFile = <T = Record<string, unknown>>(filePath: string): Effect.Effect<T[], DatabaseError> =>
                Effect.try({
                    try: () => readFileSync(filePath, "utf8"),
                    catch: (e) => new DatabaseError({ message: `Failed to read SQL file: ${filePath}`, cause: e }),
                }).pipe(Effect.flatMap((sql) => query<T>(sql)))

            return DuckDb.of({ execute, query, executeSQLFile, queryFile })
        }),
    )
