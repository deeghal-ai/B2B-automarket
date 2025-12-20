# Feature Spec: Seller Excel Upload with Column Mapping

## Overview

Sellers upload their vehicle inventory via Excel/CSV files. Since each seller has their own export format, we provide a column mapping interface that lets them match their columns to our database fields.

## User Stories

### US-1: Upload Excel File
**As a** seller
**I want to** upload my Excel file with vehicle data
**So that** I can import my inventory quickly

**Acceptance Criteria:**
- Can drag-and-drop or click to select file
- Accepts .xlsx, .xls, and .csv files
- Shows file name and size after selection
- Shows error if file type is wrong
- Maximum file size: 10MB

### US-2: Preview Data
**As a** seller
**I want to** see a preview of my data before importing
**So that** I can verify it looks correct

**Acceptance Criteria:**
- Shows first 5 rows of data
- Displays all detected column headers
- Scrollable horizontally if many columns
- Shows total row count

### US-3: Map Columns
**As a** seller
**I want to** map my column names to the system fields
**So that** my data imports correctly

**Acceptance Criteria:**
- Each detected column is in a dropdown
- You can map system fields to excel columns in dropdown
- Required fields marked with asterisk
- Can leave columns unmapped (skip)
- Validation shows if required fields are missing
- Auto-detect common column names (e.g., "Make" → make)

### US-4: Save Column Mapping
**As a** seller
**I want to** save my column mapping for reuse
**So that** I don't have to remap every time

**Acceptance Criteria:**
- Option to save mapping with a name
- Option to set as default mapping
- Can load saved mappings
- Can delete saved mappings

### US-5: Import Data
**As a** seller
**I want to** import my mapped data
**So that** my vehicles appear in my inventory

**Acceptance Criteria:**
- Shows import progress
- Validates data before import
- Shows validation errors (row by row)
- Can skip invalid rows and continue
- Success message with count of imported vehicles
- Vehicles imported as DRAFT status

## UI Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Upload File                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │     ┌──────────────────────────────────────────────┐     │  │
│  │     │  📁 Drop Excel or CSV file here              │     │  │
│  │     │     or click to browse                       │     │  │
│  │     │                                              │     │  │
│  │     │  Accepts: .xlsx, .xls, .csv (max 10MB)      │     │  │
│  │     └──────────────────────────────────────────────┘     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Use Saved Mapping ▼]                                         │
└─────────────────────────────────────────────────────────────────┘

                              ↓ (after file upload)

┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Preview & Map Columns                                  │
│                                                                 │
│  📄 inventory_export.xlsx (245 rows, 18 columns)               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Preview (first 5 rows)                                 │   │
│  │  ┌────────┬────────┬────────┬────────┬─────────────┐   │   │
│  │  │ Brand  │ Model  │ Year   │ KM     │ Price (USD) │   │   │
│  │  ├────────┼────────┼────────┼────────┼─────────────┤   │   │
│  │  │ Toyota │ Camry  │ 2022   │ 45000  │ 25000       │   │   │
│  │  │ Honda  │ Accord │ 2021   │ 52000  │ 23000       │   │   │
│  │  │ ...    │ ...    │ ...    │ ...    │ ...         │   │   │
│  │  └────────┴────────┴────────┴────────┴─────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Column Mapping:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Your Column          →    Our Field                    │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │  Brand                →    [Make ▼]              ✓     │   │
│  │  Model                →    [Model ▼]             ✓     │   │
│  │  Year                 →    [Year ▼]              ✓     │   │
│  │  KM                   →    [Mileage ▼]           ✓     │   │
│  │  Price (USD)          →    [Price ▼]             ✓     │   │
│  │  Color                →    [Color ▼]             ✓     │   │
│  │  Condition            →    [Condition ▼]         ✓     │   │
│  │  VIN                  →    [VIN ▼]               ✓     │   │
│  │  Notes                →    [-- Skip --  ▼]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ⚠️ Required fields missing: Body Type, Fuel Type, Transmission │
│                                                                 │
│  [ ] Save this mapping as: [________________]                  │
│  [ ] Set as default                                            │
│                                                                 │
│  [← Back]                              [Validate & Preview →]  │
└─────────────────────────────────────────────────────────────────┘

                              ↓ (after validation)

┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Review & Import                                        │
│                                                                 │
│  ✅ 238 rows valid and ready to import                         │
│  ⚠️ 7 rows have errors (will be skipped)                       │
│                                                                 │
│  [View Errors ▼]                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Row 45: Invalid VIN format                              │   │
│  │ Row 89: Price is not a number                           │   │
│  │ Row 102: Year out of range (1850)                       │   │
│  │ ...                                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [← Back]                                [Import 238 Vehicles] │
└─────────────────────────────────────────────────────────────────┘

                              ↓ (importing)

┌─────────────────────────────────────────────────────────────────┐
│  Importing...                                                   │
│                                                                 │
│  ████████████████░░░░░░░░░░░░░░ 52% (124/238)                  │
│                                                                 │
│  Please don't close this page                                   │
└─────────────────────────────────────────────────────────────────┘

                              ↓ (complete)

┌─────────────────────────────────────────────────────────────────┐
│  ✅ Import Complete!                                            │
│                                                                 │
│  Successfully imported 238 vehicles as drafts.                  │
│                                                                 │
│  [Upload Another File]        [Go to Inventory →]              │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### File Parsing (using xlsx library)

```typescript
// src/lib/excel-parser.ts
import * as XLSX from 'xlsx';

export interface ParsedExcel {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export function parseExcelFile(file: File): Promise<ParsedExcel> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1).map((row: any[]) => {
        const obj: Record<string, any> = {};
        headers.forEach((header, i) => {
          obj[header] = row[i];
        });
        return obj;
      });
      
      resolve({
        headers,
        rows,
        totalRows: rows.length,
      });
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
```

### Auto-Detection for Common Column Names

```typescript
// src/lib/column-auto-detect.ts
const COLUMN_ALIASES: Record<string, string[]> = {
  make: ['make', 'brand', 'manufacturer', 'car brand', 'vehicle make'],
  model: ['model', 'car model', 'vehicle model'],
  variant: ['variant', 'trim', 'trim level', 'version', 'edition'],
  year: ['year', 'model year', 'manufacturing year', 'mfg year', 'yr'],
  color: ['color', 'colour', 'exterior color', 'ext color'],
  condition: ['condition', 'vehicle condition', 'state'],
  mileage: ['mileage', 'km', 'kilometers', 'miles', 'odometer'],
  price: ['price', 'price usd', 'amount', 'cost', 'selling price'],
  vin: ['vin', 'vin number', 'chassis', 'chassis number'],
  // ... add more
};

export function autoDetectMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(normalized)) {
        mapping[header] = field;
        break;
      }
    }
  }
  
  return mapping;
}
```

### Validation Rules

```typescript
// src/lib/vehicle-validator.ts
export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function validateVehicleRow(
  row: Record<string, any>,
  rowIndex: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Required fields
  const required = ['make', 'model', 'year', 'price', 'vin', 'mileage', 
                    'condition', 'color', 'fuelType', 'transmission', 
                    'drivetrain', 'bodyType', 'city', 'country'];
  
  for (const field of required) {
    if (!row[field]) {
      errors.push({ row: rowIndex, field, message: `${field} is required` });
    }
  }
  
  // Year validation
  if (row.year) {
    const year = parseInt(row.year);
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      errors.push({ row: rowIndex, field: 'year', message: 'Invalid year' });
    }
  }
  
  // Price validation
  if (row.price) {
    const price = parseFloat(row.price);
    if (isNaN(price) || price <= 0) {
      errors.push({ row: rowIndex, field: 'price', message: 'Invalid price' });
    }
  }
  
  // VIN validation (basic - 17 characters)
  if (row.vin && row.vin.length !== 17) {
    errors.push({ row: rowIndex, field: 'vin', message: 'VIN must be 17 characters' });
  }
  
  // Enum validations
  const validConditions = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
  if (row.condition && !validConditions.includes(row.condition.toUpperCase())) {
    errors.push({ row: rowIndex, field: 'condition', message: 'Invalid condition' });
  }
  
  // ... more validations
  
  return errors;
}
```

### API Endpoints

```typescript
// POST /api/upload/parse
// Body: FormData with file
// Returns: { headers, previewRows, totalRows }

// POST /api/upload/validate
// Body: { rows, mapping }
// Returns: { validRows, errors }

// POST /api/upload/import
// Body: { rows, mapping }
// Returns: { imported, skipped, errors }

// GET /api/mappings
// Returns: { mappings: ColumnMapping[] }

// POST /api/mappings
// Body: { name, mapping, isDefault }
// Returns: { mapping: ColumnMapping }

// DELETE /api/mappings/:id
```

## Components to Build

1. `UploadDropzone` - File drag-and-drop component
2. `DataPreview` - Table showing first N rows
3. `ColumnMapper` - Mapping interface with dropdowns
4. `MappingSelector` - Dropdown to load saved mappings
5. `ValidationErrors` - List of row errors
6. `ImportProgress` - Progress bar during import
7. `ImportSummary` - Success/failure summary

## Files to Create

```
src/
├── app/
│   └── seller/
│       └── upload/
│           └── page.tsx
├── components/
│   └── seller/
│       ├── upload-dropzone.tsx
│       ├── data-preview.tsx
│       ├── column-mapper.tsx
│       ├── mapping-selector.tsx
│       ├── validation-errors.tsx
│       ├── import-progress.tsx
│       └── import-summary.tsx
├── lib/
│   ├── excel-parser.ts
│   ├── column-auto-detect.ts
│   └── vehicle-validator.ts
└── app/
    └── api/
        ├── upload/
        │   ├── parse/route.ts
        │   ├── validate/route.ts
        │   └── import/route.ts
        └── mappings/
            ├── route.ts
            └── [id]/route.ts
```

