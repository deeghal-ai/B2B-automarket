// User & Auth Types
export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Vehicle Types
export type Condition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type BodyType = 'SEDAN' | 'SUV' | 'HATCHBACK' | 'COUPE' | 'CONVERTIBLE' | 'WAGON' | 'VAN' | 'TRUCK' | 'PICKUP' | 'OTHER';
export type FuelType = 'PETROL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'PLUGIN_HYBRID' | 'OTHER';
export type Transmission = 'AUTOMATIC' | 'MANUAL' | 'CVT' | 'DCT' | 'OTHER';
export type Drivetrain = 'FWD' | 'RWD' | 'AWD' | 'FOUR_WD';
export type VehicleStatus = 'DRAFT' | 'PUBLISHED' | 'SOLD' | 'RESERVED';

export interface Vehicle {
  id: string;
  sellerId: string;
  vin: string;
  registrationNo: string | null;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  color: string;
  condition: Condition;
  bodyType: BodyType;
  regionalSpecs: string | null;
  fuelType: FuelType;
  transmission: Transmission;
  drivetrain: Drivetrain;
  engineSize: number | null;
  cylinders: number | null;
  horsepower: number | null;
  seatingCapacity: number | null;
  doors: number | null;
  mileage: number;
  city: string;
  country: string;
  description: string | null;
  features: string[];
  price: number;
  currency: string;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
  images?: VehicleImage[];
  seller?: Seller;
}

export interface VehicleImage {
  id: string;
  vehicleId: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

export interface Seller {
  id: string;
  userId: string;
  companyName: string;
  country: string;
  city: string;
  phone: string | null;
  description: string | null;
}

// Grouping Types
export type GroupingField = 'make' | 'model' | 'variant' | 'year' | 'color' | 'condition' | 'bodyType';

export interface GroupedListing {
  sellerId: string;
  sellerName: string;
  groupedValues: Partial<Record<GroupingField, string | number>>;
  unitCount: number;
  minPrice: number;
  maxPrice: number;
  minMileage: number;
  maxMileage: number;
  variants?: string[];
  conditions?: string[];
  colors?: string[];
  vehicleIds: string[];
}

// Cart Types
export interface CartVehicle {
  id: string;
  sellerId: string;
  sellerName: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  color: string;
  mileage: number;
  price: number;
  vin: string;
  imageUrl: string | null;
}

// Column Mapping Types
export interface ColumnMapping {
  id: string;
  sellerId: string;
  name: string;
  mapping: Record<string, string>;
  isDefault: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
