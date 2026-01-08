import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedMasterData() {
  // Read from Excel file in prisma/data folder
  const filePath = path.join(__dirname, 'data', 'master-vehicle-data.xlsx');
  
  console.log('Looking for master data at:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Master data file not found!');
    console.log('');
    console.log('Please create the folder and file:');
    console.log('  1. Create folder: prisma/data/');
    console.log('  2. Place your Excel file at: prisma/data/master-vehicle-data.xlsx');
    console.log('');
    console.log('Excel format should have columns: Make, Model, Variant');
    console.log('Example:');
    console.log('  | Make   | Model  | Variant |');
    console.log('  | Honda  | Accord | EX      |');
    console.log('  | Honda  | Accord | EX-L    |');
    console.log('  | Toyota | Camry  | LE      |');
    return;
  }

  console.log('✅ Found master data file');
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Try to detect column names (could be Make/Model/Variant or different)
  const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
  
  if (rawData.length === 0) {
    console.error('❌ Excel file is empty!');
    return;
  }

  // Detect column names (case-insensitive)
  const firstRow = rawData[0];
  const columns = Object.keys(firstRow);
  
  console.log('Detected columns:', columns);
  
  // Find Make, Model, Variant columns (case-insensitive)
  const findColumn = (names: string[]) => {
    return columns.find(col => 
      names.some(name => col.toLowerCase().trim() === name.toLowerCase())
    );
  };
  
  const makeCol = findColumn(['make', 'brand', 'manufacturer']);
  const modelCol = findColumn(['model', 'car model']);
  const variantCol = findColumn(['variant', 'trim', 'version', 'edition']);
  
  if (!makeCol || !modelCol || !variantCol) {
    console.error('❌ Could not find required columns!');
    console.log('Found columns:', columns);
    console.log('Expected: Make (or Brand), Model, Variant (or Trim)');
    return;
  }
  
  console.log(`Mapping columns: ${makeCol} → make, ${modelCol} → model, ${variantCol} → variant`);
  
  // Transform data
  const data = rawData.map(row => ({
    make: String(row[makeCol] || '').trim(),
    model: String(row[modelCol] || '').trim(),
    variant: String(row[variantCol] || '').trim(),
  })).filter(row => row.make && row.model && row.variant); // Filter out empty rows

  // Remove duplicates
  const uniqueData = Array.from(
    new Map(data.map(item => [`${item.make}|${item.model}|${item.variant}`, item])).values()
  );

  console.log(`Found ${rawData.length} rows, ${uniqueData.length} unique combinations`);

  // Clear existing data
  console.log('Clearing existing master data...');
  await prisma.masterVehicleData.deleteMany();

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < uniqueData.length; i += batchSize) {
    const batch = uniqueData.slice(i, i + batchSize);
    
    await prisma.masterVehicleData.createMany({
      data: batch,
      skipDuplicates: true,
    });
    
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${uniqueData.length}`);
  }

  console.log('');
  console.log('✅ Master data seeding complete!');
  console.log(`   Total records: ${uniqueData.length}`);
  
  // Show summary
  const makes = [...new Set(uniqueData.map(d => d.make))];
  console.log(`   Unique makes: ${makes.length}`);
  console.log(`   Makes: ${makes.slice(0, 10).join(', ')}${makes.length > 10 ? '...' : ''}`);
}

seedMasterData()
  .catch((error) => {
    console.error('Error seeding master data:', error);
  })
  .finally(() => prisma.$disconnect());