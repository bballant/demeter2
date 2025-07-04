import fs from "fs";
import Papa from "papaparse";
import path from "path";
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load header mappings
function loadHeaderMappings() {
  const configPath = process.env.DEMETER2_HEADER_MAPPING_CONFIG || 
                    path.join(__dirname, '../src/lib/default-header-mappings.json');
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error(`Failed to load header mappings from ${configPath}:`, error);
    process.exit(1);
  }
}

const HEADER_MAPPINGS = loadHeaderMappings();

function perturbAmount(a: string): string {
  const delta = (Math.random() - 0.5) * 2; // ±1
  return (parseFloat(a) + delta).toFixed(2);
}

function tweakDescription(description: string): string {
  if (description.includes("Nintendo")) return description.replace("Nintendo", "NintenDojo");
  if (description.includes("Amazon")) return description.replace("Amazon", "Amazin");
  if (description.includes("Starbucks")) return description.replace("Starbucks", "StarBux");
  if (description.includes("McDonald")) return description.replace("McDonald", "MacDonald");
  return `${description} Co.`;
}

function makeSample(records: Record<string, string>[], mappingType: string): Record<string, string>[] {
  const mapping = HEADER_MAPPINGS[mappingType];
  
  const processed = records.map(record => {
    const result = { ...record };
    
    // Perturb the amount
    if (record[mapping.amount]) {
      result[mapping.amount] = perturbAmount(record[mapping.amount]);
    }
    
    // Tweak the description to anonymize
    if (record[mapping.description]) {
      result[mapping.description] = tweakDescription(record[mapping.description].replace(/"/g, ""));
    }
    
    return result;
  });
  
  // randomly drop ~5%
  return processed.filter(() => Math.random() > 0.05);
}

function printUsage(): void {
  console.log("Usage: npx tsx scripts/generate-sample.ts <mapping-type> <input.csv> <output.csv>");
  console.log("Example: npx tsx scripts/generate-sample.ts fidelity input.csv samples/output.csv");
  console.log("");
  console.log("Environment variables:");
  console.log("  DEMETER2_HEADER_MAPPING_CONFIG - Path to custom header mappings JSON file");
  console.log("");
  console.log("Supported mapping types:");
  Object.keys(HEADER_MAPPINGS).forEach(type => {
    console.log(`  - ${type}`);
  });
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.error("Error: Expected exactly 3 arguments");
    printUsage();
    process.exit(1);
  }

  const [mappingType, inputFile, outputFile] = args;

  // Validate mapping type
  if (!HEADER_MAPPINGS[mappingType]) {
    console.error(`Error: Unknown mapping type '${mappingType}'`);
    console.error("Supported types:", Object.keys(HEADER_MAPPINGS).join(', '));
    process.exit(1);
  }

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
    const parseResult = Papa.parse<Record<string, string>>(input, {
      header: true,
      skipEmptyLines: true
    });
    
    if (parseResult.errors.length > 0) {
      console.error("CSV parsing errors:", parseResult.errors);
    }
    
    const records = parseResult.data;
    
    if (records.length === 0) {
      console.error("No records found in input file");
      process.exit(1);
    }
    
    console.log(`Using mapping type: ${mappingType}`);
    console.log(`Headers found: ${Object.keys(records[0]).join(', ')}`);
    
    const sample = makeSample(records, mappingType);
    
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
