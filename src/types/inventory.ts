import { Vehicle, VehicleImage, VehicleStatus } from '@prisma/client';

export type VehicleWithImage = Vehicle & {
  images: VehicleImage[];
};

// Serialized version for client components (Decimal → number)
export type SerializedVehicle = Omit<Vehicle, 'price'> & {
  price: number | null;
};

export type SerializedVehicleWithImage = SerializedVehicle & {
  images: VehicleImage[];
};

export interface VehiclesResponse {
  vehicles: VehicleWithImage[];
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  };
}

export interface InventoryFiltersState {
  status: VehicleStatus | 'ALL';
  search: string;
  page: number;
}

export type BulkAction = 'publish' | 'unpublish' | 'delete';

