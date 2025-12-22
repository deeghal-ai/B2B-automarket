import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined, currency: string = 'USD'): string {
  // Show RFQ for null, undefined, or zero prices
  if (price === null || price === undefined || price === 0) {
    return 'RFQ';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatMileage(km: number): string {
  return `${formatNumber(km)} km`;
}

export function truncateVin(vin: string): string {
  if (vin.length <= 6) return vin;
  return `...${vin.slice(-6)}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Enum display helpers
export const conditionLabels: Record<string, string> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

export const bodyTypeLabels: Record<string, string> = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  COUPE: 'Coupe',
  CONVERTIBLE: 'Convertible',
  WAGON: 'Wagon',
  VAN: 'Van',
  TRUCK: 'Truck',
  PICKUP: 'Pickup',
  OTHER: 'Other',
};

export const fuelTypeLabels: Record<string, string> = {
  PETROL: 'Petrol',
  DIESEL: 'Diesel',
  HYBRID: 'Hybrid',
  ELECTRIC: 'Electric',
  PLUGIN_HYBRID: 'Plug-in Hybrid',
  OTHER: 'Other',
};

export const transmissionLabels: Record<string, string> = {
  AUTOMATIC: 'Automatic',
  MANUAL: 'Manual',
  CVT: 'CVT',
  DCT: 'DCT',
  OTHER: 'Other',
};

export const drivetrainLabels: Record<string, string> = {
  FWD: 'Front-Wheel Drive',
  RWD: 'Rear-Wheel Drive',
  AWD: 'All-Wheel Drive',
  FOUR_WD: '4-Wheel Drive',
};

export const vehicleStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  SOLD: 'Sold',
  RESERVED: 'Reserved',
};
