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
