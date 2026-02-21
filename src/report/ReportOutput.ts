/**
 * Report output service: write a SpendingReport to stdout or a PDF file.
 * Use ReportOutputLayer (stdout or PDF) so the report command stays format-agnostic.
 */

import { Context, Effect, Layer } from "effect"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { readFileSync, existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

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
const MARGIN = 25
const HEADER_FONT_SIZE = 14
const SECTION_FONT_SIZE = 11
const TABLE_HEADER_FONT_SIZE = 9
const BODY_FONT_SIZE = 9
const LINE_HEIGHT = 11
const SECTION_TITLE_GAP = 6
const TABLE_HEADER_GAP = 4
const ROW_GAP = 2
const SECTION_GAP = 18
const TABLE_GAP = 12
const TABLE_TITLE_TOP_PADDING = 14
const TABLE_LEFT_PADDING = 4
const MERCHANT_DISPLAY_MAX = 12
const TRANSACTION_DESC_MAX = 12
const AMOUNT_DESC_GAP = 3
const AMOUNT_COLUMN_PADDING = 4
const MIN_AMOUNT_COLUMN_WIDTH = 28
const PERIODS: ReportPeriod[] = ["recent_month", "avg_monthly", "recent_year"]

/** Title case: every word starts with a capital letter. */
function titleCase(s: string): string {
    return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

const PERIOD_TITLES: Record<ReportPeriod, (r: SpendingReport) => string> = {
    recent_month: (r) => `Recent Month (${r.recent_month_label})`,
    avg_monthly: () => "Avg Monthly",
    recent_year: (r) => `Recent Year (${r.recent_year_label})`,
}

function fmtMoney(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

/** Resolve path to demeter2.png (project root or next to dist). */
function resolveDemeter2PngPath(): string | null {
    const cwd = process.cwd()
    const fromCwd = join(cwd, "demeter2.png")
    if (existsSync(fromCwd)) return fromCwd
    const fromDist = join(fileURLToPath(import.meta.url), "..", "..", "demeter2.png")
    if (existsSync(fromDist)) return fromDist
    return null
}

async function renderReportPdf(report: SpendingReport): Promise<Uint8Array> {
    const doc = await PDFDocument.create()
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    const font = doc.embedStandardFont(StandardFonts.Helvetica)
    const fontBold = doc.embedStandardFont(StandardFonts.HelveticaBold)

    // PDF y-axis: origin at bottom. We draw from top (y = PAGE_HEIGHT - MARGIN) downward.
    let y = PAGE_HEIGHT - MARGIN

    const draw = (text: string, x: number, yPos: number, size: number, opts: { bold?: boolean } = {}) => {
        page.drawText(text, {
            x,
            y: yPos,
            size,
            font: opts.bold ? fontBold : font,
        })
    }

    const drawRowAmountLeft = (
        amountStr: string,
        descStr: string,
        xPos: number,
        yPos: number,
        amountColWidth: number,
        maxDescChars: number,
    ) => {
        const amountWidth = font.widthOfTextAtSize(amountStr, BODY_FONT_SIZE)
        page.drawText(amountStr, {
            x: xPos + amountColWidth - amountWidth,
            y: yPos,
            size: BODY_FONT_SIZE,
            font,
        })
        page.drawText(descStr.slice(0, maxDescChars), {
            x: xPos + amountColWidth + AMOUNT_DESC_GAP,
            y: yPos,
            size: BODY_FONT_SIZE,
            font,
        })
    }

    const drawTableHeadingCentered = (title: string, xPos: number, tableW: number, yPos: number) => {
        const titleWidth = fontBold.widthOfTextAtSize(title, TABLE_HEADER_FONT_SIZE)
        const titleX = xPos + Math.max(0, (tableW - titleWidth) / 2)
        draw(title, titleX, yPos, TABLE_HEADER_FONT_SIZE, { bold: true })
    }

    const maxAmountWidth = (amounts: number[]) => {
        if (amounts.length === 0) return MIN_AMOUNT_COLUMN_WIDTH
        let w = 0
        for (const a of amounts) {
            const tw = font.widthOfTextAtSize(fmtMoney(a), BODY_FONT_SIZE)
            if (tw > w) w = tw
        }
        return Math.max(MIN_AMOUNT_COLUMN_WIDTH, w + AMOUNT_COLUMN_PADDING)
    }

    const drawTableBorder = (xPos: number, bottomY: number, w: number, h: number) => {
        page.drawRectangle({
            x: xPos,
            y: bottomY,
            width: w,
            height: h,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
        })
    }

    // Header: "Budget Report <Date>"
    const reportDate = report.recent_year_label.replace(/^Year ending\s+/i, "").trim()
    draw("Budget Report " + reportDate, MARGIN, y, HEADER_FONT_SIZE, { bold: true })
    y -= HEADER_FONT_SIZE + 8

    const usableWidth = PAGE_WIDTH - 2 * MARGIN
    const numTablesForAvg = 2
    const numTablesForOthers = 3
    const tableWidth2 = (usableWidth - TABLE_GAP) / 2
    const tableWidth3 = (usableWidth - 2 * TABLE_GAP) / 3

    for (const period of PERIODS) {
        const p = report.periods[period]
        const hasTransactions = period !== "avg_monthly"
        const numTables = hasTransactions ? numTablesForOthers : numTablesForAvg
        const tableWidth = hasTransactions ? tableWidth3 : tableWidth2
        const maxRows = 12

        // Section title (Title Case)
        draw(titleCase(PERIOD_TITLES[period](report)), MARGIN, y, SECTION_FONT_SIZE, { bold: true })
        y -= LINE_HEIGHT + SECTION_TITLE_GAP

        const tableStartY = y
        const rowHeight = LINE_HEIGHT + ROW_GAP
        const tableHeight = LINE_HEIGHT + TABLE_HEADER_GAP + maxRows * rowHeight
        const tableHeightWithTitlePadding = tableHeight + TABLE_TITLE_TOP_PADDING

        // Table 1: Top 10 Categories (amount left, right-justified; description right)
        let x = MARGIN
        const catAmountColWidth = maxAmountWidth(p.top_categories.slice(0, maxRows).map((c) => c.spend))
        drawTableHeadingCentered("Top 12 Categories", x, tableWidth, y)
        y -= LINE_HEIGHT + TABLE_HEADER_GAP
        p.top_categories.slice(0, maxRows).forEach((c) => {
            drawRowAmountLeft(fmtMoney(c.spend), c.tag_name, x + TABLE_LEFT_PADDING, y, catAmountColWidth, 28)
            y -= rowHeight
        })
        drawTableBorder(x, tableStartY - tableHeight, tableWidth, tableHeightWithTitlePadding)
        y = tableStartY
        x += tableWidth + TABLE_GAP

        // Table 2: Top 10 Merchants (amount left, right-justified; description right; 12-char display)
        const merchAmountColWidth = maxAmountWidth(p.top_merchants.slice(0, maxRows).map((m) => m.spend))
        drawTableHeadingCentered("Top 12 Merchants", x, tableWidth, y)
        y -= LINE_HEIGHT + TABLE_HEADER_GAP
        p.top_merchants.slice(0, maxRows).forEach((m) => {
            drawRowAmountLeft(fmtMoney(m.spend), m.merchant, x + TABLE_LEFT_PADDING, y, merchAmountColWidth, MERCHANT_DISPLAY_MAX)
            y -= rowHeight
        })
        drawTableBorder(x, tableStartY - tableHeight, tableWidth, tableHeightWithTitlePadding)
        y = tableStartY
        x += tableWidth + TABLE_GAP

        // Table 3: Top 10 Transactions (right column when 3 tables; skipped for avg_monthly)
        if (hasTransactions) {
            drawTableHeadingCentered("Top 12 Transactions", x, tableWidth, y)
            y -= LINE_HEIGHT + TABLE_HEADER_GAP
            p.top_transactions.slice(0, maxRows).forEach((t) => {
                const line = `${t.date} ${fmtMoney(t.amount)} ${t.description.slice(0, TRANSACTION_DESC_MAX)}`
                draw(line, x + TABLE_LEFT_PADDING, y, BODY_FONT_SIZE)
                y -= rowHeight
            })
            drawTableBorder(x, tableStartY - tableHeight, tableWidth, tableHeightWithTitlePadding)
        }

        y = tableStartY - tableHeight - SECTION_GAP
    }

    // Center bottom: demeter2.png (centered horizontally, raised off bottom)
    const IMAGE_BOTTOM_MARGIN = 55
    const pngPath = resolveDemeter2PngPath()
    if (pngPath) {
        try {
            const pngBytes = readFileSync(pngPath)
            const img = await doc.embedPng(pngBytes)
            const imgMaxSize = 90
            const scale = Math.min(imgMaxSize / img.width, imgMaxSize / img.height, 1)
            const w = img.width * scale
            const h = img.height * scale
            const imgX = (PAGE_WIDTH - w) / 2
            const imgY = IMAGE_BOTTOM_MARGIN
            page.drawImage(img, { x: imgX, y: imgY, width: w, height: h })
        } catch {
            // ignore if image can't be loaded
        }
    }

    return (await doc.save()) as Uint8Array
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
