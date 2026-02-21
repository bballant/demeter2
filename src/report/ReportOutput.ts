/**
 * Report output service: write a SpendingReport to stdout or a PDF file.
 * Use ReportOutputLayer (stdout or PDF) so the report command stays format-agnostic.
 */

import { Context, Effect, Layer } from "effect"
import { PDFDocument, StandardFonts } from "pdf-lib"
import { writeFileSync } from "node:fs"

import type { ReportPeriod, SpendingReport } from "../db/model.js"
import { formatReport } from "./buildReport.js"
import { Console } from "effect"

/** Error from report output (e.g. PDF write failure). */
export class ReportOutputError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options)
        this.name = "ReportOutputError"
    }
}

export type ReportOutput = {
    readonly write: (report: SpendingReport) => Effect.Effect<void, ReportOutputError>
}

export const ReportOutput = Context.GenericTag<ReportOutput>("ReportOutput")

/** Writes the report as plain text to stdout. */
export const makeStdoutReportOutputLayer = (): Layer.Layer<ReportOutput> =>
    Layer.succeed(ReportOutput, {
        write: (report) =>
            Console.log(formatReport(report)).pipe(
                Effect.asVoid,
                Effect.mapError((e) => new ReportOutputError(String(e))),
            ),
    })

// --- PDF rendering (one page) ---

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 20
const COL_WIDTH = (PAGE_WIDTH - 2 * MARGIN) / 3
const FONT_SIZE = 6
const LINE_HEIGHT = 7
const PERIODS: ReportPeriod[] = ["recent_month", "avg_monthly", "recent_year"]
const PERIOD_TITLES: Record<ReportPeriod, (r: SpendingReport) => string> = {
    recent_month: (r) => `Recent month (${r.recent_month_label})`,
    avg_monthly: () => "Avg monthly",
    recent_year: (r) => `Year (${r.recent_year_label})`,
}

function fmtMoney(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

async function renderReportPdf(report: SpendingReport): Promise<Uint8Array> {
    const doc = await PDFDocument.create()
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    const font = doc.embedStandardFont(StandardFonts.Helvetica)
    const fontBold = doc.embedStandardFont(StandardFonts.HelveticaBold)

    const draw = (text: string, x: number, y: number, opts: { bold?: boolean } = {}) => {
        page.drawText(text.slice(0, 55), {
            x,
            y,
            size: FONT_SIZE,
            font: opts.bold ? fontBold : font,
        })
    }

    for (let col = 0; col < 3; col++) {
        const period = PERIODS[col]
        const x = MARGIN + col * COL_WIDTH
        let y = PAGE_HEIGHT - MARGIN
        const p = report.periods[period]

        draw(PERIOD_TITLES[period](report), x, y, { bold: true })
        y -= LINE_HEIGHT

        draw("Top 10 categories", x, y)
        y -= LINE_HEIGHT
        p.top_categories.slice(0, 10).forEach((c) => {
            draw(`  ${c.tag_name}: ${fmtMoney(c.spend)}`, x, y)
            y -= LINE_HEIGHT
        })
        y -= LINE_HEIGHT * 0.5

        if (period !== "avg_monthly") {
            draw("Top 10 transactions", x, y)
            y -= LINE_HEIGHT
            p.top_transactions.slice(0, 10).forEach((t) => {
                draw(`  ${t.date} ${fmtMoney(t.amount)} ${t.description.slice(0, 28)}`, x, y)
                y -= LINE_HEIGHT
            })
            y -= LINE_HEIGHT * 0.5
        }

        draw("Top 10 merchants", x, y)
        y -= LINE_HEIGHT
        p.top_merchants.slice(0, 10).forEach((m) => {
            draw(`  ${m.merchant}: ${fmtMoney(m.spend)}`, x, y)
            y -= LINE_HEIGHT
        })
    }

    return await doc.save() as Uint8Array
}

/** Writes the report as a one-page PDF to the given path. */
export const makePdfReportOutputLayer = (outputPath: string): Layer.Layer<ReportOutput> =>
    Layer.succeed(ReportOutput, {
        write: (report) =>
            Effect.tryPromise({
                try: async () => {
                    const bytes = await renderReportPdf(report)
                    writeFileSync(outputPath, bytes)
                },
                catch: (e) =>
                    new ReportOutputError(
                        `Failed to write PDF to ${outputPath}: ${e instanceof Error ? e.message : String(e)}`,
                        e instanceof Error ? { cause: e } : undefined,
                    ),
            }),
    })
