// All mappable vehicle fields (matches Prisma schema)
export const VEHICLE_FIELDS = [
  // Required fields
  'vin',
  'make',
  'model',
  'year',
  'color',
  'condition',
  'bodyType',
  'fuelType',
  'transmission',
  'drivetrain',
  'mileage',
  'price',
  'city',
  'country',
  // Optional fields
  'variant',
  'registrationNo',
  'regionalSpecs',
  'engineSize',
  'cylinders',
  'horsepower',
  'seatingCapacity',
  'doors',
  'description',
  'features',
  'currency',
] as const;

export type VehicleField = (typeof VEHICLE_FIELDS)[number];

// Required fields for import (must be mapped)
export const REQUIRED_VEHICLE_FIELDS: VehicleField[] = [
  'make',
  'model',
  'year',
  'color',
  'variant',
  'condition',
];

// Human-readable labels for vehicle fields
export const VEHICLE_FIELD_LABELS: Record<VehicleField, string> = {
  vin: 'VIN',
  make: 'Make',
  model: 'Model',
  year: 'Year',
  color: 'Color',
  condition: 'Condition',
  bodyType: 'Body Type',
  fuelType: 'Fuel Type',
  transmission: 'Transmission',
  drivetrain: 'Drivetrain',
  mileage: 'Mileage',
  price: 'Price',
  city: 'City',
  country: 'Country',
  variant: 'Variant/Trim',
  registrationNo: 'Registration No.',
  regionalSpecs: 'Regional Specs',
  engineSize: 'Engine Size',
  cylinders: 'Cylinders',
  horsepower: 'Horsepower',
  seatingCapacity: 'Seating Capacity',
  doors: 'Doors',
  description: 'Description',
  features: 'Features',
  currency: 'Currency',
};

// Maps VehicleField → Excel header (or null if not mapped)
export type ColumnMappingState = Partial<Record<VehicleField, string | null>>;

// Validation result for column mapping
export interface MappingValidation {
  isValid: boolean;
  missingRequired: VehicleField[];
  mappedFields: VehicleField[];
}

// Saved mapping (for future DB storage)
export interface SavedColumnMapping {
  id: string;
  name: string;
  mapping: ColumnMappingState;
  isDefault: boolean;
  createdAt: Date;
}

// ============================================
// Validation Types (P2)
// ============================================

// Error from validating a single row
export interface ValidationError {
  row: number; // 1-indexed row number (Excel row)
  field: string; // Which field failed validation
  message: string; // Human-readable error message
  value?: unknown; // The invalid value (for debugging)
}

// Transformed vehicle data ready for database insert
export interface TransformedVehicle {
  // Required fields
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
  condition: string; // Will be uppercase enum value
  bodyType: string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  mileage: number;
  price: number;
  city: string;
  country: string;
  currency: string;
  // Optional fields
  variant?: string | null;
  registrationNo?: string | null;
  regionalSpecs?: string | null;
  engineSize?: number | null;
  cylinders?: number | null;
  horsepower?: number | null;
  seatingCapacity?: number | null;
  doors?: number | null;
  description?: string | null;
  features?: string[];
}

// Result of validating all rows
export interface ValidationResult {
  validRows: TransformedVehicle[];
  invalidRowCount: number;
  errors: ValidationError[];
  totalRows: number;
}

// API response for validation endpoint
export interface ValidateResponse {
  success: boolean;
  validRows: TransformedVehicle[];
  invalidRowCount: number;
  errors: ValidationError[];
  totalRows: number;
}

// API response for import endpoint
export interface ImportResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ index: number; message: string }>;
}

// Import state for UI
export type ImportState = 'idle' | 'validating' | 'validated' | 'importing' | 'complete' | 'error';

