import type { Omit } from 'utility-types';
import type { Transaction } from './types';

export function parseCsv(
  text: string,
  filename: string
): Omit<Transaction, 'id'>[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);
  lines.shift(); // drop header

  return lines.map((line) => {
    const cols = line.split(',');
    const date = cols[0].replace(/"/g, '');
    const description = (cols[2] || '').replace(/"/g, '');
    const amount = Number((cols[4] || '').replace(/"/g, '')) || 0;
    return { date, description, amount, filename };
  });
}
