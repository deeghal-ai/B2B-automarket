// Types for dynamic vehicle grouping feature

/**
 * Fields that can be used for grouping vehicles
 */
export type GroupingField =
  | 'make'
  | 'model'
  | 'variant'
  | 'year'
  | 'color'
  | 'condition'
  | 'bodyType';

/**
 * All valid grouping fields - used for validation
 */
export const VALID_GROUPING_FIELDS: GroupingField[] = [
  'make',
  'model',
  'variant',
  'year',
  'color',
  'condition',
  'bodyType',
];

/**
 * Default grouping fields when user hasn't selected any
 */
export const DEFAULT_GROUPING_FIELDS: GroupingField[] = ['make', 'model', 'year'];

/**
 * A grouped listing representing multiple vehicles with same attributes from one seller
 */
export interface GroupedListing {
  // Seller info
  sellerId: string;
  sellerName: string;

  // Grouped field values (only fields that were grouped by)
  make?: string;
  model?: string;
  variant?: string;
  year?: number;
  color?: string;
  condition?: string;
  bodyType?: string;

  // Aggregated data
  unitCount: number;
  minPrice: number;
  maxPrice: number;
  minMileage: number;
  maxMileage: number;

  // Ungrouped field aggregations (what varies within the group)
  variants?: string[];
  conditions?: string[];
  colors?: string[];
  years?: number[];
  bodyTypes?: string[];

  // Incoterms in this group (for display as badge)
  incoterms?: string[];

  // Vehicle IDs for expansion
  vehicleIds: string[];
}

/**
 * Request body for grouped listings API
 */
export interface GroupedListingsRequest {
  groupBy: GroupingField[];
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    minMileage?: number;
    maxMileage?: number;
    country?: string;
    make?: string;
    model?: string;
    condition?: string;
    bodyType?: string;
    fuelType?: string;
    transmission?: string;
  };
  page?: number;
  limit?: number;
}

/**
 * Response from grouped listings API
 */
export interface GroupedListingsResponse {
  listings: GroupedListing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totalVehicles: number;
}

/**
 * Request body for vehicles by IDs API
 */
export interface VehiclesByIdsRequest {
  vehicleIds: string[];
}

/**
 * Vehicle with primary image for display in expanded groups
 */
export interface VehicleWithImage {
  id: string;
  vin: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  color: string;
  condition: string;
  bodyType: string;
  mileage: number;
  price: number | null;
  currency: string | null;
  incoterm: string | null;
  city: string;
  country: string;
  sellerId: string;
  primaryImage: string | null;
}

/**
 * Extended vehicle with seller info for flat listings
 */
export interface VehicleWithSellerInfo extends VehicleWithImage {
  sellerName: string;
}

/**
 * Valid sort fields for flat listings
 */
export type FlatSortField = 
  | 'make'
  | 'model'
  | 'year'
  | 'price'
  | 'mileage'
  | 'createdAt';

/**
 * Valid sort orders
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Request body for flat listings API
 */
export interface FlatListingsRequest {
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    minMileage?: number;
    maxMileage?: number;
    country?: string;
    make?: string;
    model?: string;
    condition?: string;
    bodyType?: string;
    fuelType?: string;
    transmission?: string;
  };
  sortBy?: FlatSortField;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

/**
 * Response from flat listings API
 */
export interface FlatListingsResponse {
  vehicles: VehicleWithSellerInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

