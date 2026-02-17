import { expect } from "chai"
import { Effect } from "effect"
import { unlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { DuckDb } from "../../../src/db/DuckDb.js"

import { DuckDb as DuckDbTag, makeDuckDbLayer } from "../../../src/db/DuckDb.js"
import {
    getAllConfigValues,
    getConfigValue,
    setConfigValue,
    unsetConfigValue,
} from "../../../src/db/config.js"
import { DatabaseError } from "../../../src/db/errors.js"

const createTestDbPath = (): string =>
    join(tmpdir(), `demeter2-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`)

const runWithDb = <A>(dbPath: string, effect: Effect.Effect<A, DatabaseError, DuckDb>) =>
    Effect.runPromise(Effect.provide(effect, makeDuckDbLayer(dbPath)))

describe("config database operations", () => {
    let dbPath: string

    beforeEach(async () => {
        dbPath = createTestDbPath()
        await runWithDb(
            dbPath,
            Effect.gen(function* () {
                const db = yield* DuckDbTag
                yield* db.execute("CREATE TABLE IF NOT EXISTS config (key VARCHAR PRIMARY KEY, value VARCHAR)")
            }),
        )
    })

    afterEach(() => {
        try { unlinkSync(dbPath) } catch { /* ignore */ }
    })

    describe("setConfigValue / getConfigValue", () => {
        it("should set and get a string value", async () => {
            const value = await runWithDb(
                dbPath,
                Effect.gen(function* () {
                    yield* setConfigValue("myKey", "myValue")
                    return yield* getConfigValue("myKey")
                }),
            )
            expect(value).to.equal("myValue")
        })

        it("should return null for non-existent key", async () => {
            const value = await runWithDb(dbPath, getConfigValue("nonExistent"))
            expect(value).to.be.null
        })

        it("should overwrite existing value", async () => {
            const value = await runWithDb(
                dbPath,
                Effect.gen(function* () {
                    yield* setConfigValue("myKey", "first")
                    yield* setConfigValue("myKey", "second")
                    return yield* getConfigValue("myKey")
                }),
            )
            expect(value).to.equal("second")
        })
    })

    describe("unsetConfigValue", () => {
        it("should remove an existing value", async () => {
            const value = await runWithDb(
                dbPath,
                Effect.gen(function* () {
                    yield* setConfigValue("myKey", "12345")
                    yield* unsetConfigValue("myKey")
                    return yield* getConfigValue("myKey")
                }),
            )
            expect(value).to.be.null
        })

        it("should not error when removing non-existent key", async () => {
            await runWithDb(dbPath, unsetConfigValue("nonExistent"))
        })
    })

    describe("getAllConfigValues", () => {
        it("should return empty object when no config set", async () => {
            const config = await runWithDb(dbPath, getAllConfigValues())
            expect(config).to.deep.equal({})
        })

        it("should return all set values", async () => {
            const config = await runWithDb(
                dbPath,
                Effect.gen(function* () {
                    yield* setConfigValue("key1", "value1")
                    yield* setConfigValue("key2", "value2")
                    yield* setConfigValue("key3", "value3")
                    return yield* getAllConfigValues()
                }),
            )
            expect(config).to.deep.equal({
                key1: "value1",
                key2: "value2",
                key3: "value3",
            })
        })
    })
})
