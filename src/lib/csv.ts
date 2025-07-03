import Papa from 'papaparse';
import type { Omit } from 'utility-types';
import type { Transaction } from './types';

// Column mapping configuration
const COLUMN_MAPPINGS = {
  default: {
    date: 'Date',
    description: 'Description',
    amount: 'Amount'
  },
  fidelity: {
    date: 'Date',
    description: 'Name',
    amount: 'Amount'
  }
};

// Auto-detect which column mapping to use based on CSV headers
function detectMappingType(headers: string[]): keyof typeof COLUMN_MAPPINGS {
  // Check which mapping has the most matching headers
  const scores = Object.entries(COLUMN_MAPPINGS).map(([type, mapping]) => {
    const matches = Object.values(mapping).filter(col => headers.includes(col)).length;
    return { type: type as keyof typeof COLUMN_MAPPINGS, score: matches };
  });

  return scores.sort((a, b) => b.score - a.score)[0]?.type || 'default';
}

export function parseCsv(
  text: string,
  filename: string
): Omit<Transaction, 'id'>[] {
  const results = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true
  });

  if (results.data.length === 0) return [];

  const headers = Object.keys(results.data[0]);
  const mappingType = detectMappingType(headers);
  const mapping = COLUMN_MAPPINGS[mappingType];

  return results.data.map((record: Record<string, string>) => {
    const date = (record[mapping.date] || '').trim();
    const description = (record[mapping.description] || '').trim();
    const amountStr = (record[mapping.amount] || '0').trim();
    const amount = Math.round((parseFloat(amountStr) || 0) * 100);

    return { date, description, amount, filename };
  });
}
