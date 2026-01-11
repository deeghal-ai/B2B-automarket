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
  price: number | null;
  currency?: string | null;
  incoterm?: string | null;
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

// Negotiation Types
export type NegotiationStatus = 'DRAFT' | 'BUYER_FINALIZED' | 'SELLER_APPROVED' | 'CANCELLED';

export interface NegotiationItem {
  id: string;
  negotiationId: string;
  vehicleId: string;
  systemPrice: number;
  offerPrice: number;
  vehicle?: Vehicle & {
    images?: VehicleImage[];
  };
}

export interface NegotiationMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderRole: 'BUYER' | 'SELLER';
  content: string;
  createdAt: Date;
}

export interface Negotiation {
  id: string;
  buyerId: string;
  sellerId: string;
  status: NegotiationStatus;
  incoterm: string;
  depositPercent: number;
  createdAt: Date;
  updatedAt: Date;
  items?: NegotiationItem[];
  messages?: NegotiationMessage[];
  seller?: Seller;
}

export interface NegotiationWithDetails extends Negotiation {
  items: NegotiationItem[];
  messages: NegotiationMessage[];
  seller: Seller;
  // Computed values
  systemTotal: number;
  negotiatedTotal: number;
  savings: number;
  tokenDueNow: number;
  finalBalance: number;
}

export interface CreateNegotiationRequest {
  sellerId: string;
  items: {
    vehicleId: string;
    offerPrice: number;
  }[];
  incoterm?: string;
  depositPercent?: number;
}

export interface UpdateNegotiationRequest {
  items?: {
    vehicleId: string;
    offerPrice: number;
  }[];
  incoterm?: string;
  depositPercent?: number;
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
