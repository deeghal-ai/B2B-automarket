'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ShoppingCart, Store, Check } from 'lucide-react';
import { GroupedListing, GroupingField } from '@/types/grouping';
import { VehicleSelectionList } from './vehicle-selection-list';
import { formatPrice, formatMileage, conditionLabels } from '@/lib/utils';
import type { CartVehicle } from '@/types';

interface Props {
  listing: GroupedListing;
  groupedFields: GroupingField[];
  onAddToCart: (vehicles: CartVehicle[]) => void;
}

export function GroupedListingCard({ listing, groupedFields, onAddToCart }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadedVehicles, setLoadedVehicles] = useState<CartVehicle[]>([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedCount, setAddedCount] = useState<number | null>(null);

  // Build display title from grouped field values
  const titleParts: string[] = [];
  if (listing.make) titleParts.push(listing.make);
  if (listing.model) titleParts.push(listing.model);
  if (listing.variant) titleParts.push(listing.variant);
  if (listing.year) titleParts.push(String(listing.year));
  if (listing.color) titleParts.push(listing.color);
  if (listing.condition) titleParts.push(conditionLabels[listing.condition] || listing.condition);
  
  const title = titleParts.join(' ') || 'Vehicle Group';

  // Format price range
  const priceRange =
    listing.minPrice === listing.maxPrice
      ? formatPrice(listing.minPrice)
      : `${formatPrice(listing.minPrice)} - ${formatPrice(listing.maxPrice)}`;

  // Format mileage range
  const mileageRange =
    listing.minMileage === listing.maxMileage
      ? formatMileage(listing.minMileage)
      : `${formatMileage(listing.minMileage)} - ${formatMileage(listing.maxMileage)}`;

  // Get what varies within the group (ungrouped fields)
  const variationInfo: string[] = [];
  if (listing.variants && listing.variants.length > 1 && !groupedFields.includes('variant')) {
    variationInfo.push(`Variants: ${listing.variants.join(', ')}`);
  }
  if (listing.colors && listing.colors.length > 1 && !groupedFields.includes('color')) {
    variationInfo.push(`Colors: ${listing.colors.join(', ')}`);
  }
  if (listing.conditions && listing.conditions.length > 1 && !groupedFields.includes('condition')) {
    const labels = listing.conditions.map((c) => conditionLabels[c] || c);
    variationInfo.push(`Conditions: ${labels.join(', ')}`);
  }
  if (listing.years && listing.years.length > 1 && !groupedFields.includes('year')) {
    const sortedYears = [...listing.years].sort();
    variationInfo.push(`Years: ${sortedYears[0]} - ${sortedYears[sortedYears.length - 1]}`);
  }

  const showAddedFeedback = (count: number) => {
    setAddedCount(count);
    setTimeout(() => setAddedCount(null), 2000);
  };

  const handleAddToCart = async () => {
    // If we have selected vehicles from expanded view, add those
    if (selectedIds.length > 0 && loadedVehicles.length > 0) {
      const selectedVehicles = loadedVehicles.filter((v) => selectedIds.includes(v.id));
      onAddToCart(selectedVehicles);
      showAddedFeedback(selectedVehicles.length);
      setSelectedIds([]); // Clear selection after adding
      return;
    }

    // If vehicles are already loaded (from expanded view), add all
    if (loadedVehicles.length > 0) {
      onAddToCart(loadedVehicles);
      showAddedFeedback(loadedVehicles.length);
      return;
    }

    // Otherwise, fetch vehicles first then add to cart
    setIsAddingToCart(true);
    try {
      const response = await fetch('/api/vehicles/by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleIds: listing.vehicleIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }

      const data = await response.json();
      const cartVehicles: CartVehicle[] = data.map((v: {
        id: string;
        sellerId: string;
        make: string;
        model: string;
        variant: string | null;
        year: number;
        color: string;
        mileage: number;
        price: number;
        vin: string;
        primaryImage: string | null;
      }) => ({
        id: v.id,
        sellerId: v.sellerId,
        sellerName: listing.sellerName,
        make: v.make,
        model: v.model,
        variant: v.variant,
        year: v.year,
        color: v.color,
        mileage: v.mileage,
        price: v.price,
        vin: v.vin,
        imageUrl: v.primaryImage,
      }));

      setLoadedVehicles(cartVehicles);
      onAddToCart(cartVehicles);
      showAddedFeedback(cartVehicles.length);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleVehiclesLoaded = (vehicles: CartVehicle[]) => {
    setLoadedVehicles(vehicles);
  };

  const buttonLabel =
    selectedIds.length > 0
      ? `Add ${selectedIds.length} to Cart`
      : `Add All (${listing.unitCount}) to Cart`;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image placeholder */}
          <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
            <span className="text-4xl">🚗</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-lg truncate">{title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Store className="h-3 w-3" />
                  <span className="truncate">{listing.sellerName}</span>
                </div>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">
                {listing.unitCount} {listing.unitCount === 1 ? 'unit' : 'units'}
              </Badge>
            </div>

            {/* Details */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Price: </span>
                <span className="font-medium">{priceRange}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Mileage: </span>
                <span>{mileageRange}</span>
              </div>
            </div>

            {/* Variation info */}
            {variationInfo.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                {variationInfo.map((info, idx) => (
                  <span key={idx}>
                    {idx > 0 && ' • '}
                    {info}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    View {listing.unitCount} {listing.unitCount === 1 ? 'unit' : 'units'}
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isAddingToCart || addedCount !== null}
                className={addedCount !== null ? 'bg-green-600 hover:bg-green-600' : ''}
              >
                {addedCount !== null ? (
                  <>
                    <Check className="w-4 h-4 mr-1 animate-bounce" />
                    Added {addedCount} to Cart!
                  </>
                ) : isAddingToCart ? (
                  <>
                    <span className="w-4 h-4 mr-1 animate-spin">⏳</span>
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    {buttonLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded view with individual vehicles */}
        {expanded && (
          <div className="mt-4 pt-4 border-t">
            <VehicleSelectionList
              vehicleIds={listing.vehicleIds}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onVehiclesLoaded={handleVehiclesLoaded}
              sellerName={listing.sellerName}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

