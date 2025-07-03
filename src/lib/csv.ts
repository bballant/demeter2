import { parse } from 'csv-parse/sync';
import type { Omit } from 'utility-types';
import type { Transaction } from './types';

export function parseCsv(
  text: string,
  filename: string
): Omit<Transaction, 'id'>[] {
  // Parse CSV using csv-parse library
  const records: string[][] = parse(text, {
    skip_empty_lines: true,
    trim: true
  });

  // Remove header row
  records.shift();

  return records.map((cols) => {
    const date = cols[0] || '';
    const description = cols[2] || '';
    const amount = Math.round((Number(cols[4]) || 0) * 100);
    return { date, description, amount, filename };
  });
}
