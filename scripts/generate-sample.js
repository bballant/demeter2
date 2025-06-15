import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const input = fs.readFileSync("../../../tmp/fidelity_01-01-2024_06-12-2025.csv", "utf-8");
const records = parse(input, { columns: true, skip_empty_lines: true });

// helper to slightly perturb amount
function perturbAmount(a) {
  const delta = (Math.random() - 0.5) * 2; // ±1
  return (parseFloat(a) + delta).toFixed(2);
}

// helper to tweak vendor name
function tweakName(name) {
  if (name.includes("Nintendo")) return name.replace("Nintendo", "NintenDojo");
  if (name.includes("Amazon")) return name.replace("Amazon", "Amazin");
  // add more rules as desired
  return name + " Co.";
}

// generate for a given month
function makeSample(month, year) {
  const filtered = records
    .filter(r => r.Date.startsWith(`${year}-${month.toString().padStart(2,"0")}`))
    .map(r => ({
      Date: r.Date,
      Transaction: r.Transaction,
      Name: `"${tweakName(r.Name.replace(/"/g, ''))}"`,
      Memo: r.Memo,
      Amount: perturbAmount(r.Amount)
    }));
  // randomly drop ~5% of rows
  const sample = filtered.filter(() => Math.random() > 0.05);
  return sample;
}

for (const [m, y] of [[3,2024],[4,2024]]) {
  const out = makeSample(m,y);
  const file = `sample-files/sampletxn${m}-${y}.csv`;
  fs.writeFileSync(file, stringify(out, { header: true }));
  console.log(`Wrote ${out.length} rows to ${file}`);
}
