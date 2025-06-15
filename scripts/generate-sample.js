import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

interface FidelityRecord {
  Date: string;
  Transaction: string;
  Name: string;
  Memo: string;
  Amount: string;
}

interface SampleRecord {
  Date: string;
  Transaction: string;
  Name: string;
  Memo: string;
  Amount: string;
}

function perturbAmount(a: string): string {
  const delta = (Math.random() - 0.5) * 2; // ±1
  return (parseFloat(a) + delta).toFixed(2);
}

function tweakName(name: string): string {
  if (name.includes("Nintendo")) return name.replace("Nintendo", "NintenDojo");
  if (name.includes("Amazon")) return name.replace("Amazon", "Amazin");
  return `${name} Co.`;
}

function makeSample(records: FidelityRecord[], month: number, year: number): SampleRecord[] {
  const filtered = records
    .filter(r => r.Date.startsWith(`${year}-${String(month).padStart(2, "0")}`))
    .map(r => ({
      Date: r.Date,
      Transaction: r.Transaction,
      Name: tweakName(r.Name.replace(/"/g, "")),
      Memo: r.Memo,
      Amount: perturbAmount(r.Amount),
    }));
  // randomly drop ~5%
  return filtered.filter(() => Math.random() > 0.05);
}

async function main(): Promise<void> {
  const input = fs.readFileSync("../../../tmp/fidelity_01-01-2024_06-12-2025.csv", "utf-8");
  const records: FidelityRecord[] = parse(input, { columns: true, skip_empty_lines: true });
  for (const [month, year] of [[3, 2024], [4, 2024]]) {
    const sample = makeSample(records, month, year);
    const file = `static/sampletxn${month}-${year}.csv`;
    fs.writeFileSync(file, stringify(sample, { header: true }));
    console.log(`Wrote ${sample.length} rows to ${file}`);
  }
}

main().catch(console.error);
