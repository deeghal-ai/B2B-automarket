'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart } from 'lucide-react';
import { VehicleWithImage } from '@/types/grouping';
import { formatPrice, formatMileage, truncateVin, conditionLabels } from '@/lib/utils';
import type { CartVehicle } from '@/types';

interface Props {
  vehicleIds: string[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onVehiclesLoaded?: (vehicles: CartVehicle[]) => void;
  sellerName: string;
  cartVehicleIds?: Set<string>;
}

export function VehicleSelectionList({
  vehicleIds,
  selectedIds,
  onSelectionChange,
  onVehiclesLoaded,
  sellerName,
  cartVehicleIds = new Set(),
}: Props) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<VehicleWithImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Use ref to avoid infinite loop with callback in deps
  const onVehiclesLoadedRef = useRef(onVehiclesLoaded);
  onVehiclesLoadedRef.current = onVehiclesLoaded;

  const INITIAL_DISPLAY_COUNT = 5;

  // Count how many vehicles are already in cart
  const inCartCount = useMemo(
    () => vehicles.filter((v) => cartVehicleIds.has(v.id)).length,
    [vehicles, cartVehicleIds]
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchVehicles() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/vehicles/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleIds }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch vehicles');
        }

        const data: VehicleWithImage[] = await response.json();
        
        if (cancelled) return;
        
        setVehicles(data);

        // Notify parent of loaded vehicles for cart functionality
        if (onVehiclesLoadedRef.current) {
          const cartVehicles: CartVehicle[] = data.map((v) => ({
            id: v.id,
            sellerId: v.sellerId,
            sellerName,
            make: v.make,
            model: v.model,
            variant: v.variant,
            year: v.year,
            color: v.color,
            mileage: v.mileage,
            price: v.price,
            currency: v.currency,
            incoterm: v.incoterm,
            vin: v.vin,
            imageUrl: v.primaryImage,
          }));
          onVehiclesLoadedRef.current(cartVehicles);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load vehicles');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (vehicleIds.length > 0) {
      fetchVehicles();
    } else {
      setIsLoading(false);
      setVehicles([]);
    }

    return () => {
      cancelled = true;
    };
  }, [vehicleIds, sellerName]);

  const allSelected = vehicles.length > 0 && selectedIds.length === vehicles.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < vehicles.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(vehicles.map((v) => v.id));
    }
  };

  const toggleVehicle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading vehicles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No vehicles found</p>
      </div>
    );
  }

  const displayedVehicles = showAll
    ? vehicles
    : vehicles.slice(0, INITIAL_DISPLAY_COUNT);
  const hiddenCount = vehicles.length - INITIAL_DISPLAY_COUNT;

  return (
    <div className="space-y-3">
      {/* Select All Header */}
      <div className="flex items-center justify-between pb-2 border-b">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={toggleAll}
          />
          <span className="text-sm font-medium">
            {allSelected
              ? 'Deselect All'
              : someSelected
                ? `${selectedIds.length} of ${vehicles.length} selected`
                : 'Select All'}
          </span>
          {inCartCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({inCartCount} already in cart)
            </span>
          )}
        </label>
      </div>

      {/* Vehicle List */}
      <div className="space-y-2">
        {displayedVehicles.map((vehicle) => {
          const isInCart = cartVehicleIds.has(vehicle.id);
          return (
            <div
              key={vehicle.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${
                isInCart
                  ? 'bg-primary/5 border-primary/20'
                  : selectedIds.includes(vehicle.id)
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/20'
              }`}
              onClick={() => router.push(`/buyer/vehicle/${vehicle.id}`)}
            >
              {/* Checkbox - stop propagation so clicking it doesn't navigate */}
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.includes(vehicle.id)}
                  onCheckedChange={() => toggleVehicle(vehicle.id)}
                />
              </div>

              {/* Image */}
              <div className="w-16 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                {vehicle.primaryImage ? (
                  <img
                    src={vehicle.primaryImage}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl">🚗</span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                {/* Title: Make Model Year - always show */}
                <div className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                  <span>
                    {vehicle.make} {vehicle.model} {vehicle.year}
                    {vehicle.variant && (
                      <span className="font-normal text-muted-foreground ml-1">
                        ({vehicle.variant})
                      </span>
                    )}
                  </span>
                  {isInCart && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 h-5">
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      In Cart
                    </Badge>
                  )}
                </div>
                {/* Sub details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                  <span>{vehicle.color}</span>
                  <span>{formatMileage(vehicle.mileage)}</span>
                  <span className="font-mono">VIN: {truncateVin(vehicle.vin)}</span>
                </div>
              </div>

              {/* Price with Incoterm */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="font-bold text-base">
                  {formatPrice(vehicle.price, vehicle.currency ?? undefined)}
                </span>
                {vehicle.incoterm && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                    {vehicle.incoterm}
                  </Badge>
                )}
              </div>

              {/* Condition Badge */}
              <Badge variant="outline" className="flex-shrink-0 hidden sm:inline-flex">
                {conditionLabels[vehicle.condition] || vehicle.condition}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Show More */}
      {hiddenCount > 0 && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowAll(true)}
        >
          Show {hiddenCount} more {hiddenCount === 1 ? 'vehicle' : 'vehicles'}
        </Button>
      )}

      {showAll && vehicles.length > INITIAL_DISPLAY_COUNT && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowAll(false)}
        >
          Show less
        </Button>
      )}
    </div>
  );
}

