import fs from "fs";
import Papa from "papaparse";
import path from "path";

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

function makeSample(records: FidelityRecord[]): SampleRecord[] {
  const processed = records.map(r => ({
    Date: r.Date,
    Transaction: r.Transaction,
    Name: tweakName(r.Name.replace(/"/g, "")),
    Memo: r.Memo,
    Amount: perturbAmount(r.Amount),
  }));
  // randomly drop ~5%
  return processed.filter(() => Math.random() > 0.05);
}

function printUsage(): void {
  console.log("Usage: npx tsx scripts/generate-sample.ts <input.csv> <output.csv>");
  console.log("Example: npx tsx scripts/generate-sample.ts input.csv samples/output.csv");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error("Error: Expected exactly 2 arguments");
    printUsage();
    process.exit(1);
  }

  const [inputFile, outputFile] = args;

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file '${inputFile}' does not exist`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const input = fs.readFileSync(inputFile, "utf-8");
    
    // Parse CSV using papaparse
    const parseResult = Papa.parse<FidelityRecord>(input, {
      header: true,
      skipEmptyLines: true
    });
    
    if (parseResult.errors.length > 0) {
      console.error("CSV parsing errors:", parseResult.errors);
    }
    
    const records = parseResult.data;
    const sample = makeSample(records);
    
    // Convert back to CSV using papaparse
    const csvOutput = Papa.unparse(sample);
    
    fs.writeFileSync(outputFile, csvOutput);
    console.log(`Successfully processed ${records.length} input rows`);
    console.log(`Wrote ${sample.length} sample rows to ${outputFile}`);
    
  } catch (error) {
    console.error(`Error processing files: ${error}`);
    process.exit(1);
  }
}

main().catch(console.error);
