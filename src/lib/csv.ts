import Papa from 'papaparse';
import type { Omit } from 'utility-types';
import type { Transaction } from './types';
import defaultMappings from './default-header-mappings.json';
import fs from 'fs';

const loadColumnMappings = () => {
  const configPath = undefined; //process.env.DEMETER2_HEADER_MAPPING_CONFIG;
  if (configPath) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      console.warn(`Failed to load custom header mappings from ${configPath}:`, error);
      console.warn('Falling back to default mappings');
    }
  }
  return defaultMappings;
}

const COLUMN_MAPPINGS = loadColumnMappings();

// Auto-detect which column mapping to use based on CSV headers
function detectMappingType(headers: string[]): keyof typeof COLUMN_MAPPINGS {
  // Check which mapping has the most matching headers
  const scores = Object.entries(COLUMN_MAPPINGS).map(([type, mapping]) => {
    const mappingValues = Object.values(mapping as Record<string, string>);
    const matches = mappingValues.filter(col => headers.includes(col)).length;
    return { type: type as keyof typeof COLUMN_MAPPINGS, score: matches };
  });

  return scores.sort((a, b) => b.score - a.score)[0]?.type || 'default';
}

// Convert MM/DD/YYYY format to YYYY-MM-DD format
function normalizeDate(dateStr: string): string {
  const trimmed = dateStr.trim();

  // Check if it matches MM/DD/YYYY format
  const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = trimmed.match(mmddyyyyPattern);

  if (match) {
    const [, month, day, year] = match;
    // Pad month and day with leading zeros if needed
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  // Return as-is if not MM/DD/YYYY format
  return trimmed;
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
    const rawDate = (record[mapping.date] || '').trim();
    const date = normalizeDate(rawDate);
    const description = (record[mapping.description] || '').trim();
    const amountStr = (record[mapping.amount] || '0').trim();
    const amount = Math.round((parseFloat(amountStr) || 0) * 100);

    return { date, description, amount, filename };
  });
}
