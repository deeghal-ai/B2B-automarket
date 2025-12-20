import {
  ColumnMappingState,
  ValidationError,
  ValidationResult,
  TransformedVehicle,
  VehicleField,
  REQUIRED_VEHICLE_FIELDS,
  VEHICLE_FIELD_LABELS,
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
const CONDITION_ALIASES: Record<string, string> = {
  'excellent': 'EXCELLENT',
  'good': 'GOOD',
  'fair': 'FAIR',
  'poor': 'POOR',
  'very good': 'GOOD',
  'average': 'FAIR',
  'bad': 'POOR',
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

// ============================================
// Main Validation Function
// ============================================

interface SellerInfo {
  city: string;
  country: string;
}

/**
 * Transform and validate Excel rows using the column mapping
 */
export function validateAndTransformRows(
  rows: Record<string, unknown>[],
  mapping: ColumnMappingState,
  sellerInfo: SellerInfo
): ValidationResult {
  const validRows: TransformedVehicle[] = [];
  const errors: ValidationError[] = [];
  let invalidRowCount = 0;

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

    // Price (optional, default 0)
    const priceRaw = getValue('price');
    const price = parseNumber(priceRaw);
    if (priceRaw && price === null) {
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
    } else {
      transformed.price = price ?? 0;
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

    // Currency (optional, default USD)
    const currency = getValue('currency');
    transformed.currency = currency && String(currency).trim() !== '' 
      ? String(currency).trim().toUpperCase() 
      : 'USD';

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

