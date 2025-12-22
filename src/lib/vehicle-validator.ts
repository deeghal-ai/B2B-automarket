import {
  ColumnMappingState,
  ValidationError,
  ValidationResult,
  TransformedVehicle,
  VehicleField,
  REQUIRED_VEHICLE_FIELDS,
  VEHICLE_FIELD_LABELS,
  ImportDefaults,
  INCOTERM_OPTIONS,
} from '@/types/upload';

// ============================================
// Enum Definitions (must match Prisma schema)
// ============================================

const VALID_CONDITIONS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'] as const;
const VALID_BODY_TYPES = [
  'SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE',
  'WAGON', 'VAN', 'TRUCK', 'PICKUP', 'OTHER'
] as const;
const VALID_FUEL_TYPES = [
  'PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUGIN_HYBRID', 'OTHER'
] as const;
const VALID_TRANSMISSIONS = ['AUTOMATIC', 'MANUAL', 'CVT', 'DCT', 'OTHER'] as const;
const VALID_DRIVETRAINS = ['FWD', 'RWD', 'AWD', 'FOUR_WD'] as const;

// ============================================
// Enum Normalization Maps
// ============================================

// Maps common input variations to our enum values
// Includes letter grades (A, B, C, D) common in Asian auto markets
const CONDITION_ALIASES: Record<string, string> = {
  'excellent': 'EXCELLENT',
  'good': 'GOOD',
  'fair': 'FAIR',
  'poor': 'POOR',
  'very good': 'GOOD',
  'average': 'FAIR',
  'bad': 'POOR',
  // Letter grades (common in Japan/China)
  'a': 'EXCELLENT',
  'a+': 'EXCELLENT',
  'a-': 'EXCELLENT',
  'b': 'GOOD',
  'b+': 'GOOD',
  'b-': 'GOOD',
  'c': 'FAIR',
  'c+': 'FAIR',
  'c-': 'FAIR',
  'd': 'POOR',
  'd+': 'POOR',
  'd-': 'POOR',
  // Numeric grades
  '1': 'EXCELLENT',
  '2': 'GOOD',
  '3': 'FAIR',
  '4': 'POOR',
  '5': 'POOR',
};

const BODY_TYPE_ALIASES: Record<string, string> = {
  'sedan': 'SEDAN',
  'suv': 'SUV',
  'hatchback': 'HATCHBACK',
  'coupe': 'COUPE',
  'convertible': 'CONVERTIBLE',
  'wagon': 'WAGON',
  'van': 'VAN',
  'truck': 'TRUCK',
  'pickup': 'PICKUP',
  'pick-up': 'PICKUP',
  'pick up': 'PICKUP',
  'other': 'OTHER',
  'saloon': 'SEDAN',
  'estate': 'WAGON',
  'mpv': 'VAN',
  'minivan': 'VAN',
  'crossover': 'SUV',
};

const FUEL_TYPE_ALIASES: Record<string, string> = {
  'petrol': 'PETROL',
  'gasoline': 'PETROL',
  'gas': 'PETROL',
  'diesel': 'DIESEL',
  'hybrid': 'HYBRID',
  'electric': 'ELECTRIC',
  'ev': 'ELECTRIC',
  'plug-in hybrid': 'PLUGIN_HYBRID',
  'plugin hybrid': 'PLUGIN_HYBRID',
  'phev': 'PLUGIN_HYBRID',
  'other': 'OTHER',
};

const TRANSMISSION_ALIASES: Record<string, string> = {
  'automatic': 'AUTOMATIC',
  'auto': 'AUTOMATIC',
  'at': 'AUTOMATIC',
  'manual': 'MANUAL',
  'mt': 'MANUAL',
  'stick': 'MANUAL',
  'cvt': 'CVT',
  'dct': 'DCT',
  'dual clutch': 'DCT',
  'other': 'OTHER',
};

const DRIVETRAIN_ALIASES: Record<string, string> = {
  'fwd': 'FWD',
  'front wheel drive': 'FWD',
  'front-wheel drive': 'FWD',
  'rwd': 'RWD',
  'rear wheel drive': 'RWD',
  'rear-wheel drive': 'RWD',
  'awd': 'AWD',
  'all wheel drive': 'AWD',
  'all-wheel drive': 'AWD',
  '4wd': 'FOUR_WD',
  '4x4': 'FOUR_WD',
  'four wheel drive': 'FOUR_WD',
  'four-wheel drive': 'FOUR_WD',
};

const INCOTERM_ALIASES: Record<string, string> = {
  'fob': 'FOB',
  'cif': 'CIF',
};

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize an enum value using aliases
 */
function normalizeEnum(
  value: unknown,
  aliases: Record<string, string>,
  validValues: readonly string[]
): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).toLowerCase().trim();
  
  // Check aliases first
  if (aliases[strValue]) {
    return aliases[strValue];
  }
  
  // Check if it's already a valid uppercase value
  const upperValue = strValue.toUpperCase();
  if (validValues.includes(upperValue as typeof validValues[number])) {
    return upperValue;
  }
  
  return null;
}

/**
 * Parse a numeric value from Excel data
 */
function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Handle string numbers (may have currency symbols, commas)
  if (typeof value === 'string') {
    // Remove currency symbols, commas, spaces
    const cleaned = value.replace(/[$€¥£,\s]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  
  return null;
}

/**
 * Parse an integer value
 */
function parseInteger(value: unknown): number | null {
  const num = parseNumber(value);
  return num !== null ? Math.round(num) : null;
}

/**
 * Generate a placeholder VIN (for vehicles without VIN mapped)
 */
function generatePlaceholderVin(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  // Format: TEMP + timestamp + random = 17 characters total
  return `TEMP${timestamp}${random}`.substring(0, 17).padEnd(17, 'X');
}

/**
 * Validate VIN format (basic validation - 17 alphanumeric characters)
 */
function isValidVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') return false;
  const cleanVin = vin.trim().toUpperCase();
  // VIN must be exactly 17 characters, alphanumeric (no I, O, Q)
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin);
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Main Validation Function
// ============================================

interface SellerInfo {
  city: string;
  country: string;
}

/**
 * Transform and validate Excel rows using the column mapping
 * 
 * @param rows - Parsed Excel rows
 * @param mapping - Column mapping from vehicle field to Excel header
 * @param sellerInfo - Seller's city/country for defaults
 * @param defaults - Default values for currency/incoterm when not mapped
 */
export function validateAndTransformRows(
  rows: Record<string, unknown>[],
  mapping: ColumnMappingState,
  sellerInfo: SellerInfo,
  defaults?: ImportDefaults
): ValidationResult {
  const validRows: TransformedVehicle[] = [];
  const errors: ValidationError[] = [];
  let invalidRowCount = 0;

  // Check if price column is mapped (determines if currency/incoterm are needed)
  const isPriceColumnMapped = mapping.price !== null && mapping.price !== undefined;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // Excel row number (1-indexed, skip header)
    const row = rows[i];
    const rowErrors: ValidationError[] = [];

    // Extract values using mapping
    const getValue = (field: VehicleField): unknown => {
      const header = mapping[field];
      if (!header) return undefined;
      return row[header];
    };

    // Transform row data
    const transformed: Partial<TransformedVehicle> = {};

    // ===== Required mapped fields =====
    
    // Make (required)
    const make = getValue('make');
    if (!make || String(make).trim() === '') {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.make,
        message: 'Make is required',
        value: make,
      });
    } else {
      transformed.make = String(make).trim();
    }

    // Model (required)
    const model = getValue('model');
    if (!model || String(model).trim() === '') {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.model,
        message: 'Model is required',
        value: model,
      });
    } else {
      transformed.model = String(model).trim();
    }

    // Year (required, must be valid)
    const year = parseInteger(getValue('year'));
    const currentYear = new Date().getFullYear();
    if (year === null) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.year,
        message: 'Year is required and must be a number',
        value: getValue('year'),
      });
    } else if (year < 1900 || year > currentYear + 1) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.year,
        message: `Year must be between 1900 and ${currentYear + 1}`,
        value: year,
      });
    } else {
      transformed.year = year;
    }

    // Color (required)
    const color = getValue('color');
    if (!color || String(color).trim() === '') {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.color,
        message: 'Color is required',
        value: color,
      });
    } else {
      transformed.color = String(color).trim();
    }

    // Variant (required per DECISION-011)
    const variant = getValue('variant');
    if (!variant || String(variant).trim() === '') {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.variant,
        message: 'Variant/Trim is required',
        value: variant,
      });
    } else {
      transformed.variant = String(variant).trim();
    }

    // Condition (required, must be valid enum)
    const conditionRaw = getValue('condition');
    const condition = normalizeEnum(conditionRaw, CONDITION_ALIASES, VALID_CONDITIONS);
    if (!condition) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.condition,
        message: `Condition must be one of: ${VALID_CONDITIONS.join(', ')}`,
        value: conditionRaw,
      });
    } else {
      transformed.condition = condition;
    }

    // ===== Optional mapped fields with defaults =====

    // VIN (optional - generate if not provided)
    const vinRaw = getValue('vin');
    if (vinRaw && String(vinRaw).trim() !== '') {
      const vin = String(vinRaw).trim().toUpperCase();
      if (!isValidVin(vin)) {
        // Warn but don't block - use as-is or generate placeholder
        // For MVP, we'll use as-is even if not standard VIN format
        transformed.vin = vin.substring(0, 17).padEnd(17, 'X');
      } else {
        transformed.vin = vin;
      }
    } else {
      transformed.vin = generatePlaceholderVin();
    }

    // ===== Price, Currency, Incoterm handling =====
    
    // Price (optional - null means RFQ)
    const priceRaw = getValue('price');
    let hasPrice = false;
    
    if (isPriceColumnMapped) {
      const price = parseNumber(priceRaw);
      
      if (priceRaw !== undefined && priceRaw !== null && priceRaw !== '' && price === null) {
        // Value provided but couldn't be parsed as a number
        rowErrors.push({
          row: rowNum,
          field: VEHICLE_FIELD_LABELS.price,
          message: 'Price must be a valid number',
          value: priceRaw,
        });
      } else if (price !== null && price < 0) {
        rowErrors.push({
          row: rowNum,
          field: VEHICLE_FIELD_LABELS.price,
          message: 'Price cannot be negative',
          value: price,
        });
      } else if (price !== null) {
        transformed.price = price;
        hasPrice = true;
      } else {
        // Price column mapped but value is empty/null for this row = RFQ
        transformed.price = null;
      }
    } else {
      // Price column not mapped = all vehicles are RFQ
      transformed.price = null;
    }

    // Currency (required when price is set, from mapping or defaults)
    if (hasPrice) {
      const currencyRaw = getValue('currency');
      if (currencyRaw && String(currencyRaw).trim() !== '') {
        transformed.currency = String(currencyRaw).trim().toUpperCase();
      } else if (defaults?.currency) {
        transformed.currency = defaults.currency;
      } else {
        // Should not happen if UI validation works, but fallback to USD
        transformed.currency = 'USD';
      }
    } else {
      // No price = no currency needed (RFQ)
      transformed.currency = null;
    }

    // Incoterm (required when price is set, from mapping or defaults)
    if (hasPrice) {
      const incotermRaw = getValue('incoterm');
      const incotermNormalized = normalizeEnum(incotermRaw, INCOTERM_ALIASES, INCOTERM_OPTIONS);
      
      if (incotermNormalized) {
        transformed.incoterm = incotermNormalized;
      } else if (incotermRaw && String(incotermRaw).trim() !== '') {
        // Invalid incoterm value provided
        rowErrors.push({
          row: rowNum,
          field: VEHICLE_FIELD_LABELS.incoterm,
          message: `Incoterm must be one of: ${INCOTERM_OPTIONS.join(', ')}`,
          value: incotermRaw,
        });
      } else if (defaults?.incoterm) {
        transformed.incoterm = defaults.incoterm;
      } else {
        // Should not happen if UI validation works, but fallback to FOB
        transformed.incoterm = 'FOB';
      }
    } else {
      // No price = no incoterm needed (RFQ)
      transformed.incoterm = null;
    }

    // Mileage (optional, default 0)
    const mileageRaw = getValue('mileage');
    const mileage = parseInteger(mileageRaw);
    if (mileageRaw && mileage === null) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.mileage,
        message: 'Mileage must be a valid number',
        value: mileageRaw,
      });
    } else if (mileage !== null && mileage < 0) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.mileage,
        message: 'Mileage cannot be negative',
        value: mileage,
      });
    } else {
      transformed.mileage = mileage ?? 0;
    }

    // Body Type (optional, default OTHER)
    const bodyTypeRaw = getValue('bodyType');
    const bodyType = normalizeEnum(bodyTypeRaw, BODY_TYPE_ALIASES, VALID_BODY_TYPES);
    if (bodyTypeRaw && !bodyType) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.bodyType,
        message: `Invalid body type. Valid options: ${VALID_BODY_TYPES.join(', ')}`,
        value: bodyTypeRaw,
      });
    } else {
      transformed.bodyType = bodyType ?? 'OTHER';
    }

    // Fuel Type (optional, default OTHER)
    const fuelTypeRaw = getValue('fuelType');
    const fuelType = normalizeEnum(fuelTypeRaw, FUEL_TYPE_ALIASES, VALID_FUEL_TYPES);
    if (fuelTypeRaw && !fuelType) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.fuelType,
        message: `Invalid fuel type. Valid options: ${VALID_FUEL_TYPES.join(', ')}`,
        value: fuelTypeRaw,
      });
    } else {
      transformed.fuelType = fuelType ?? 'OTHER';
    }

    // Transmission (optional, default OTHER)
    const transmissionRaw = getValue('transmission');
    const transmission = normalizeEnum(transmissionRaw, TRANSMISSION_ALIASES, VALID_TRANSMISSIONS);
    if (transmissionRaw && !transmission) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.transmission,
        message: `Invalid transmission. Valid options: ${VALID_TRANSMISSIONS.join(', ')}`,
        value: transmissionRaw,
      });
    } else {
      transformed.transmission = transmission ?? 'OTHER';
    }

    // Drivetrain (optional, default FWD)
    const drivetrainRaw = getValue('drivetrain');
    const drivetrain = normalizeEnum(drivetrainRaw, DRIVETRAIN_ALIASES, VALID_DRIVETRAINS);
    if (drivetrainRaw && !drivetrain) {
      rowErrors.push({
        row: rowNum,
        field: VEHICLE_FIELD_LABELS.drivetrain,
        message: `Invalid drivetrain. Valid options: ${VALID_DRIVETRAINS.join(', ')}`,
        value: drivetrainRaw,
      });
    } else {
      transformed.drivetrain = drivetrain ?? 'FWD';
    }

    // City/Country (use seller's if not mapped)
    const city = getValue('city');
    transformed.city = city && String(city).trim() !== '' 
      ? String(city).trim() 
      : sellerInfo.city;

    const country = getValue('country');
    transformed.country = country && String(country).trim() !== '' 
      ? String(country).trim() 
      : sellerInfo.country;

    // ===== Other optional fields =====

    // Registration Number
    const regNo = getValue('registrationNo');
    if (regNo && String(regNo).trim() !== '') {
      transformed.registrationNo = String(regNo).trim();
    }

    // Regional Specs
    const regionalSpecs = getValue('regionalSpecs');
    if (regionalSpecs && String(regionalSpecs).trim() !== '') {
      transformed.regionalSpecs = String(regionalSpecs).trim();
    }

    // Engine Size (in liters)
    const engineSizeRaw = getValue('engineSize');
    const engineSize = parseNumber(engineSizeRaw);
    if (engineSize !== null && engineSize > 0) {
      transformed.engineSize = engineSize;
    }

    // Cylinders
    const cylindersRaw = getValue('cylinders');
    const cylinders = parseInteger(cylindersRaw);
    if (cylinders !== null && cylinders > 0) {
      transformed.cylinders = cylinders;
    }

    // Horsepower
    const horsepowerRaw = getValue('horsepower');
    const horsepower = parseInteger(horsepowerRaw);
    if (horsepower !== null && horsepower > 0) {
      transformed.horsepower = horsepower;
    }

    // Seating Capacity
    const seatingRaw = getValue('seatingCapacity');
    const seating = parseInteger(seatingRaw);
    if (seating !== null && seating > 0) {
      transformed.seatingCapacity = seating;
    }

    // Doors
    const doorsRaw = getValue('doors');
    const doors = parseInteger(doorsRaw);
    if (doors !== null && doors > 0) {
      transformed.doors = doors;
    }

    // Description
    const description = getValue('description');
    if (description && String(description).trim() !== '') {
      transformed.description = String(description).trim();
    }

    // Features (comma-separated or array)
    const featuresRaw = getValue('features');
    if (featuresRaw) {
      if (Array.isArray(featuresRaw)) {
        transformed.features = featuresRaw.map(f => String(f).trim()).filter(Boolean);
      } else if (typeof featuresRaw === 'string' && featuresRaw.trim() !== '') {
        transformed.features = featuresRaw.split(',').map(f => f.trim()).filter(Boolean);
      }
    }

    // Inspection Report Link (optional URL)
    const inspectionLinkRaw = getValue('inspectionReportLink');
    if (inspectionLinkRaw && String(inspectionLinkRaw).trim() !== '') {
      const linkValue = String(inspectionLinkRaw).trim();
      if (isValidUrl(linkValue)) {
        transformed.inspectionReportLink = linkValue;
      } else {
        // Invalid URL - warn but don't block (store as-is)
        transformed.inspectionReportLink = linkValue;
      }
    }

    // ===== Collect results =====

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      invalidRowCount++;
    } else {
      // Row is valid - add to valid rows
      validRows.push(transformed as TransformedVehicle);
    }
  }

  return {
    validRows,
    invalidRowCount,
    errors,
    totalRows: rows.length,
  };
}

/**
 * Check if all required fields are mapped
 */
export function checkRequiredFieldsMapped(mapping: ColumnMappingState): string[] {
  const missingFields: string[] = [];
  
  for (const field of REQUIRED_VEHICLE_FIELDS) {
    if (!mapping[field]) {
      missingFields.push(VEHICLE_FIELD_LABELS[field]);
    }
  }
  
  return missingFields;
}
