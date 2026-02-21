/**
 * Domain model types for the budgeting app.
 * Table names: record, tag, record_tag.
 */

/** A single line item from an imported statement (table: record). */
export type StatementRecord = {
    id: string
    date: string
    record_type: "CREDIT" | "DEBIT"
    amount: number
    description: string
    source_file: string
}

/** A label for categorizing records (table: tag). */
export type Tag = {
    id: number
    name: string
}

/** A record with its tag names attached (application-layer view). */
export type TaggedRecord = StatementRecord & { tags: string[] }

// -----------------------------------------------------------------------------
// Report schema (see report.sql for the single-query source)
// -----------------------------------------------------------------------------

/** Time period for report sections. All are relative to last date in record. */
export type ReportPeriod = "recent_month" | "avg_monthly" | "recent_year"

/** Section of the report; each has a fixed rank size of 12. */
export type ReportSection =
    | "top_categories"
    | "top_transactions"
    | "top_merchants"

/** One row from the unified report query. Exactly one of the section-specific fields is set per row. */
export type ReportRow = {
    period: ReportPeriod
    section: ReportSection
    rank: number
    /** Set when section is top_categories. */
    tag_name: string | null
    /** Set when section is top_categories. Spend is non-negative. */
    category_spend: number | null
    /** Set when section is top_merchants (normalized merchant, e.g. first 24 chars, numbers stripped). */
    merchant: string | null
    /** Set when section is top_merchants. Spend is non-negative. */
    merchant_spend: number | null
    /** Set when section is top_transactions. */
    record_id: string | null
    record_date: string | null
    record_description: string | null
    /** Amount; negative for debits. */
    record_amount: number | null
}

/** Structured report: one object per period with arrays for each section. */
export type SpendingReport = {
    /** Month ending on last day of data (YYYY-MM). */
    recent_month_label: string
    /** Year ending on last day of data (e.g. "2025–2026" or "FY ending YYYY-MM-DD"). */
    recent_year_label: string
    periods: {
        [K in ReportPeriod]: {
            top_categories: Array<{ tag_name: string; spend: number }>
            /** Top 12 transactions; empty for avg_monthly. */
            top_transactions: Array<{
                id: string
                date: string
                description: string
                amount: number
            }>
            top_merchants: Array<{ merchant: string; spend: number }>
        }
    }
}
