import fs from "fs";
import Papa from "papaparse";
import path from "path";
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load header mappings from the shared JSON file
function loadHeaderMappings() {
  const configPath = path.join(__dirname, '../src/lib/default-header-mappings.json');
  
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

// Orwellian and William Gibson inspired company names
const ORWELLIAN_COMPANY_NAMES = [
  "MiniTruth Corp", "ThoughtPol Industries", "BigBrother Systems", "Doublethink Dynamics", "NewSpeak Technologies",
  "Memory Hole Media", "Victory Gin Co", "Telescreen Solutions", "Room 101 Security", "Oceania Enterprises",
  "Eurasia Holdings", "Eastasia Group", "Prole Services", "Inner Party Ltd", "Outer Party Corp",
  "Hate Week Productions", "Two Minutes Inc", "Goldstein Analytics", "Emmanuel Corp", "Airstrip One",
  "Chestnut Tree Cafe", "Ministry of Love", "Ministry of Peace", "Ministry of Plenty", "Ministry of Truth",
  "Cyberdyne Systems", "Tessier-Ashpool", "Maas Biolabs", "Hosaka Corporation", "Ono-Sendai", 
  "Mitsubishi Bank of Asia", "Sense/Net", "Wintermute AI", "Neuromancer Corp", "Matrix Industries",
  "ICE Security", "Sprawl Dynamics", "Night City Holdings", "Chiba Systems", "Freeside Station",
  "Zion Collective", "Panther Moderns", "Screaming Fist", "Chrome Solutions", "Burning Chrome",
  "Count Zero Corp", "Mona Lisa Overdrive", "Virtual Light Co", "Idoru Entertainment", "All Tomorrow's Parties",
  "Pattern Recognition", "Spook Country", "Zero History Inc", "The Peripheral", "Agency Solutions",
  "Jackpot Industries", "Stub Dynamics", "Flynne Corp", "Wilf Holdings", "Netherton Systems",
  "Synth Corp", "Replicant Industries", "Blade Runner Security", "Tyrell Corporation", "Wallace Corp",
  "Weyland-Yutani", "Umbrella Corporation", "Cybertronics", "Skynet Defense", "Aperture Science",
  "Black Mesa Research", "Vault-Tec", "RoboCop Security", "OCP Industries", "Omni Consumer Products",
  "Soylent Corporation", "HAL Systems", "Discovery One", "Jupiter Mining Corp", "Red Dwarf Industries",
  "Nostromo Shipping", "LV-426 Mining", "Alien Biosystems", "Predator Defense", "Colonial Marines",
  "Starship Troopers", "Mobile Infantry", "Arachnid Extermination", "Federation Fleet", "Roughnecks Inc",
  "Total Recall Memory", "Rekall Incorporated", "Mars Colony Corp", "Mutant Registration", "Minority Report",
  "PreCrime Division", "Thought Police", "Memory Implants Inc", "Dream Merchants", "Reality Check Corp",
  "Simulation Theory", "Glitch Industries", "Bug Report Systems", "Patch Management", "Version Control Corp",
  "Neural Interface Co", "Brain-Computer Link", "Consciousness Upload", "Digital Afterlife", "Ghost in Shell",
  "Stand Alone Complex", "Section 9 Security", "Laughing Man Corp", "Puppet Master Inc", "Tachikoma Systems",
  "Akira Pharmaceuticals", "Neo-Tokyo Holdings", "Kaneda Motorcycles", "Tetsuo Dynamics", "Psychic Powers Inc",
  "Esper Detection", "Blade Runner Realty", "Off-World Colonies", "Spinner Transport", "Voight-Kampff Corp"
];

// Map to store consistent description replacements
const descriptionMappings = new Map<string, string>();

function getRandomOrwellianName(): string {
  return ORWELLIAN_COMPANY_NAMES[Math.floor(Math.random() * ORWELLIAN_COMPANY_NAMES.length)];
}

function tweakDescription(description: string): string {
  // Check if we already have a mapping for this description
  if (descriptionMappings.has(description)) {
    return descriptionMappings.get(description)!;
  }
  
  // Create a new mapping
  const newDescription = getRandomOrwellianName();
  descriptionMappings.set(description, newDescription);
  return newDescription;
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
    
    // Filter out field mismatch errors (common with different CSV formats)
    const significantErrors = parseResult.errors.filter(error => 
      error.type !== 'FieldMismatch'
    );
    
    if (significantErrors.length > 0) {
      console.error("CSV parsing errors:", significantErrors);
    }
    
    if (parseResult.errors.length > significantErrors.length) {
      console.log(`Note: Ignored ${parseResult.errors.length - significantErrors.length} field mismatch warnings (common with varying CSV formats)`);
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
