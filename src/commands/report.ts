import { Command, Options } from "@effect/cli"
import { Effect, Layer, Option } from "effect"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

import { DuckDb } from "../db/DuckDb.js"
import { makeDuckDbLayer } from "../db/DuckDb.js"
import { DEFAULT_DB_PATH } from "../main/shared.js"
import { buildReportFromRows, parseReportRows } from "../report/buildReport.js"
import {
    makePdfReportOutputLayer,
    makeStdoutReportOutputLayer,
    ReportOutput,
} from "../report/ReportOutput.js"

const dbOption = Options.text("db").pipe(
    Options.withAlias("d"),
    Options.withDefault(DEFAULT_DB_PATH),
    Options.withDescription(`Path to database file (default: ${DEFAULT_DB_PATH})`),
)

const outputOption = Options.choice("output", ["stdout", "pdf"] as const).pipe(
    Options.withAlias("o"),
    Options.withDefault("stdout" as const),
    Options.withDescription("Output format: stdout (text) or pdf"),
)

const outOption = Options.text("out").pipe(
    Options.withDescription("Output path for PDF (default: report.pdf when -o pdf)"),
    Options.optional,
)

/** Path to report.sql next to the built command (dist/sql/report.sql). */
const reportSqlPath = join(
    fileURLToPath(import.meta.url),
    "..",
    "..",
    "sql",
    "report.sql",
)

const LAST_DATE_SQL = "SELECT MAX(date) AS last_d FROM record"

export const reportCmd = Command.make(
    "report",
    { db: dbOption, output: outputOption, out: outOption },
    ({ db, output, out }) =>
        Effect.gen(function* () {
            const duckDb = yield* DuckDb

            const lastDateRows = yield* duckDb.query<{ last_d: string }>(LAST_DATE_SQL)
            const lastDate = lastDateRows[0]?.last_d
            if (lastDate == null || String(lastDate).trim() === "") {
                yield* Effect.fail(new Error("No records in database; cannot run report."))
            }
            const lastDateStr = String(lastDate).trim().slice(0, 10)

            const rawRows = yield* duckDb.queryFile(reportSqlPath)
            const rows = parseReportRows(rawRows as Record<string, unknown>[])
            const report = buildReportFromRows(rows, lastDateStr)

            const reportOutput = yield* ReportOutput
            yield* reportOutput.write(report)

            if (output === "pdf") {
                const path = Option.getOrElse(out, () => "report.pdf")
                yield* Effect.log(`Wrote PDF to ${path}`)
            }
        }).pipe(
            Effect.provide(
                Layer.merge(
                    makeDuckDbLayer(db),
                    output === "pdf"
                        ? makePdfReportOutputLayer(Option.getOrElse(out, () => "report.pdf"))
                        : makeStdoutReportOutputLayer(),
                ),
            ),
        ),
)
