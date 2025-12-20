import { VehicleField, ColumnMappingState } from '@/types/upload';

/**
 * Common aliases for vehicle fields that sellers might use in their Excel exports.
 * Keys are our VehicleField names, values are lowercase aliases to match against.
 */
const COLUMN_ALIASES: Record<VehicleField, string[]> = {
  // Required fields
  vin: ['vin', 'vin number', 'chassis', 'chassis number', 'chassis no', 'vehicle identification number'],
  make: ['make', 'brand', 'manufacturer', 'car brand', 'vehicle make', 'car make'],
  model: ['model', 'car model', 'vehicle model'],
  year: ['year', 'model year', 'manufacturing year', 'mfg year', 'yr', 'production year'],
  color: ['color', 'colour', 'exterior color', 'ext color', 'exterior colour', 'body color'],
  condition: ['condition', 'vehicle condition', 'state', 'grade'],
  bodyType: ['body type', 'bodytype', 'body style', 'body', 'type', 'vehicle type', 'car type'],
  fuelType: ['fuel type', 'fueltype', 'fuel', 'engine type', 'power source'],
  transmission: ['transmission', 'gearbox', 'trans', 'gear type', 'transmission type'],
  drivetrain: ['drivetrain', 'drive train', 'drive type', 'drive', 'wheel drive', '4wd', 'awd', 'fwd', 'rwd'],
  mileage: ['mileage', 'km', 'kilometers', 'kilometres', 'miles', 'odometer', 'odo', 'kms'],
  price: ['price', 'price usd', 'amount', 'cost', 'selling price', 'asking price', 'sale price', 'usd'],
  city: ['city', 'location city', 'vehicle city'],
  country: ['country', 'location country', 'origin', 'source country'],
  
  // Optional fields
  variant: ['variant', 'trim', 'trim level', 'version', 'edition', 'sub model', 'submodel', 'spec'],
  registrationNo: ['registration', 'registration no', 'reg no', 'plate', 'plate number', 'license plate'],
  regionalSpecs: ['regional specs', 'specs', 'specification', 'gcc', 'american spec', 'european spec', 'japanese spec'],
  engineSize: ['engine size', 'engine', 'displacement', 'cc', 'liters', 'litres', 'engine cc', 'engine capacity'],
  cylinders: ['cylinders', 'cylinder', 'cyl', 'no of cylinders'],
  horsepower: ['horsepower', 'hp', 'power', 'bhp', 'horse power', 'engine power'],
  seatingCapacity: ['seating capacity', 'seats', 'seating', 'passengers', 'no of seats', 'seat count'],
  doors: ['doors', 'door', 'no of doors', 'door count'],
  description: ['description', 'desc', 'notes', 'remarks', 'comments', 'details', 'vehicle description'],
  features: ['features', 'options', 'extras', 'equipment', 'accessories'],
  currency: ['currency', 'curr', 'price currency'],
};

/**
 * Normalizes a column header for comparison.
 * Removes extra whitespace, converts to lowercase.
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_-]/g, ' ')  // Replace underscores and hyphens with spaces
    .replace(/\s+/g, ' ');  // Collapse multiple spaces
}

/**
 * Auto-detects column mappings based on common header names.
 * Returns a mapping from vehicle fields to Excel column names.
 * 
 * @param headers - Array of column headers from the Excel file
 * @returns Mapping where keys are VehicleField names, values are matched Excel header or null
 */
export function autoDetectMapping(headers: string[]): ColumnMappingState {
  const mapping: ColumnMappingState = {};
  const usedHeaders = new Set<string>();

  // For each vehicle field, try to find a matching Excel header
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [VehicleField, string[]][]) {
    let matchedHeader: string | null = null;

    for (const header of headers) {
      // Skip if this header has already been used
      if (usedHeaders.has(header)) continue;

      const normalized = normalizeHeader(header);

      // Check if any alias matches (exact match first, then partial)
      const exactMatch = aliases.some(alias => normalized === alias);
      const partialMatch = aliases.some(alias => normalized.includes(alias) || alias.includes(normalized));

      if (exactMatch || partialMatch) {
        matchedHeader = header;
        usedHeaders.add(header);
        break;
      }
    }

    if (matchedHeader) {
      mapping[field] = matchedHeader;
    }
  }

  return mapping;
}

/**
 * Gets the confidence level of a mapping (for UI feedback).
 * Could be expanded for fuzzy matching in the future.
 */
export function getMappingConfidence(header: string, field: VehicleField): 'high' | 'medium' | 'low' {
  const normalized = normalizeHeader(header);
  const aliases = COLUMN_ALIASES[field];

  // Exact match = high confidence
  if (aliases.includes(normalized)) {
    return 'high';
  }

  // Partial match = medium confidence
  if (aliases.some(alias => normalized.includes(alias) || alias.includes(normalized))) {
    return 'medium';
  }

  return 'low';
}

