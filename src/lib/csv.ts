import Papa from 'papaparse';
import type { Omit } from 'utility-types';
import type { Transaction } from './types';

export function parseCsv(
  text: string,
  filename: string
): Omit<Transaction, 'id'>[] {
  // Parse CSV using papaparse
  const result = Papa.parse(text, {
    skipEmptyLines: true,
    header: false // We want arrays, not objects
  });

  const records = result.data as string[][];

  // Remove header row
  records.shift();

  return records.map((cols) => {
    const date = cols[0] || '';
    const description = cols[2] || '';
    const amount = Math.round((Number(cols[4]) || 0) * 100);
    return { date, description, amount, filename };
  });
}
