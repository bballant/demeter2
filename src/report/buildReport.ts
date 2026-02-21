/**
 * Build and format the spending report from raw DB rows.
 */

import type {
    ReportPeriod,
    ReportRow,
    ReportSection,
    SpendingReport,
} from "../db/model.js"

const PERIODS: ReportPeriod[] = ["recent_month", "avg_monthly", "recent_year"]
const SECTIONS: ReportSection[] = [
    "top_categories",
    "top_transactions",
    "top_merchants",
]

/** Raw row from DuckDB (numbers may be strings). */
type RawReportRow = Record<string, unknown>

function num(x: unknown): number {
    if (typeof x === "number" && !Number.isNaN(x)) return x
    const n = Number(x)
    return Number.isNaN(n) ? 0 : n
}

function str(x: unknown): string | null {
    if (x == null) return null
    const s = String(x).trim()
    return s === "" ? null : s
}

/** Parse query result rows into typed ReportRow[]. */
export function parseReportRows(raw: RawReportRow[]): ReportRow[] {
    return raw.map((r) => ({
        period: str(r.period) as ReportPeriod,
        section: str(r.section) as ReportSection,
        rank: num(r.rank),
        tag_name: str(r.tag_name),
        category_spend: r.category_spend != null ? num(r.category_spend) : null,
        merchant: str(r.merchant),
        merchant_spend: r.merchant_spend != null ? num(r.merchant_spend) : null,
        record_id: str(r.record_id),
        record_date: r.record_date != null ? str(r.record_date) ?? null : null,
        record_description: str(r.record_description),
        record_amount: r.record_amount != null ? num(r.record_amount) : null,
    }))
}

/** Build SpendingReport from flat rows and the last date in the data. */
export function buildReportFromRows(
    rows: ReportRow[],
    lastDate: string,
): SpendingReport {
    const last = lastDate.slice(0, 10) // YYYY-MM-DD
    const [y, m] = last.split("-").map(Number)
    const recent_month_label = `${y}-${String(m).padStart(2, "0")}`
    const recent_year_label = `Year ending ${last}`

    const byPeriod = (period: ReportPeriod) => (r: ReportRow) => r.period === period
    const bySection = (section: ReportSection) => (r: ReportRow) => r.section === section

    const emptyPeriod = () => ({
        top_categories: [] as Array<{ tag_name: string; spend: number }>,
        top_transactions: [] as Array<{
            id: string
            date: string
            description: string
            amount: number
        }>,
        top_merchants: [] as Array<{ merchant: string; spend: number; category?: string }>,
    })

    const report: SpendingReport = {
        recent_month_label,
        recent_year_label,
        periods: {
            recent_month: emptyPeriod(),
            avg_monthly: emptyPeriod(),
            recent_year: emptyPeriod(),
        },
    }

    for (const period of PERIODS) {
        const periodRows = rows.filter(byPeriod(period))
        const p = report.periods[period]

        const catRows = periodRows.filter(bySection("top_categories"))
        for (const r of catRows) {
            if (r.tag_name != null && r.category_spend != null)
                p.top_categories.push({ tag_name: r.tag_name, spend: r.category_spend })
        }

        const merchRows = periodRows.filter(bySection("top_merchants"))
        for (const r of merchRows) {
            if (r.merchant != null && r.merchant_spend != null)
                p.top_merchants.push({
                    merchant: r.merchant,
                    spend: r.merchant_spend,
                    ...(r.tag_name != null && r.tag_name !== "" ? { category: r.tag_name } : {}),
                })
        }

        const txRows = periodRows.filter(bySection("top_transactions"))
        for (const r of txRows) {
            if (
                r.record_id != null &&
                r.record_date != null &&
                r.record_description != null &&
                r.record_amount != null
            )
                p.top_transactions.push({
                    id: r.record_id,
                    date: r.record_date,
                    description: r.record_description,
                    amount: r.record_amount,
                })
        }
    }

    return report
}

function fmtMoney(n: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n)
}

function fmtDate(s: string): string {
    return s.slice(0, 10)
}

/** Truncate merchant only, then append " (Category)" so category is never cut off. */
export function formatMerchantDisplay(
    merchant: string,
    category?: string | null,
    maxMerchantLen: number = 40,
): string {
    const m = merchant.slice(0, maxMerchantLen).trimEnd()
    return category ? `${m} (${category})` : m
}

/** Format SpendingReport as plain text for stdout. */
export function formatReport(report: SpendingReport): string {
    const lines: string[] = []
    const section = (title: string, fn: () => void) => {
        lines.push("")
        lines.push(`--- ${title} ---`)
        fn()
    }

    const periodTitles: Record<ReportPeriod, string> = {
        recent_month: `Recent month (${report.recent_month_label})`,
        avg_monthly: "Avg monthly (over year)",
        recent_year: `Recent year (${report.recent_year_label})`,
    }

    for (const period of PERIODS) {
        const p = report.periods[period]
        lines.push("")
        lines.push("")
        lines.push(`========== ${periodTitles[period]} ==========`)

        section("Top 12 categories by spend", () => {
            if (p.top_categories.length === 0) lines.push("(none)")
            else
                p.top_categories.forEach((c, i) =>
                    lines.push(`  ${i + 1}. ${c.tag_name}: ${fmtMoney(c.spend)}`),
                )
        })

        if (period !== "avg_monthly") {
            section("Top 12 transactions by spend", () => {
                if (p.top_transactions.length === 0) lines.push("(none)")
                else
                    p.top_transactions.forEach((t, i) =>
                        lines.push(
                            `  ${i + 1}. ${fmtDate(t.date)} ${fmtMoney(t.amount)}  ${t.description.slice(0, 50)}${t.description.length > 50 ? "…" : ""}`,
                        ),
                    )
            })
        }

        section("Top 12 merchants by spend", () => {
            if (p.top_merchants.length === 0) lines.push("(none)")
            else
                p.top_merchants.forEach((m, i) => {
                    const label = formatMerchantDisplay(m.merchant, m.category, 40)
                    lines.push(`  ${i + 1}. ${label}: ${fmtMoney(m.spend)}`)
                })
        })
    }

    return lines.join("\n").replace(/^\n+/, "")
}
