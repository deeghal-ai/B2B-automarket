'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { GroupingSelector } from './grouping-selector';
import { GroupedListingCard } from './grouped-listing-card';
import { SearchFilters, FilterState } from './search-filters';
import { useCartStore } from '@/stores/cart-store';
import {
  GroupingField,
  GroupedListing,
  GroupedListingsResponse,
  DEFAULT_GROUPING_FIELDS,
} from '@/types/grouping';
import type { CartVehicle } from '@/types';
import { formatNumber } from '@/lib/utils';

const STORAGE_KEY = 'buyer-grouping-preference';

/**
 * Parse filters from URL search params
 */
function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  const filters: FilterState = {};

  const search = searchParams.get('search');
  if (search) filters.search = search;

  const minPrice = searchParams.get('minPrice');
  if (minPrice) filters.minPrice = parseInt(minPrice, 10);

  const maxPrice = searchParams.get('maxPrice');
  if (maxPrice) filters.maxPrice = parseInt(maxPrice, 10);

  const minYear = searchParams.get('minYear');
  if (minYear) filters.minYear = parseInt(minYear, 10);

  const maxYear = searchParams.get('maxYear');
  if (maxYear) filters.maxYear = parseInt(maxYear, 10);

  const minMileage = searchParams.get('minMileage');
  if (minMileage) filters.minMileage = parseInt(minMileage, 10);

  const maxMileage = searchParams.get('maxMileage');
  if (maxMileage) filters.maxMileage = parseInt(maxMileage, 10);

  const country = searchParams.get('country');
  if (country) filters.country = country;

  const condition = searchParams.get('condition');
  if (condition) filters.condition = condition;

  const bodyType = searchParams.get('bodyType');
  if (bodyType) filters.bodyType = bodyType;

  const fuelType = searchParams.get('fuelType');
  if (fuelType) filters.fuelType = fuelType;

  const transmission = searchParams.get('transmission');
  if (transmission) filters.transmission = transmission;

  return filters;
}

/**
 * Serialize filters to URL search params
 */
function serializeFiltersToURL(
  filters: FilterState,
  params: URLSearchParams
): void {
  // Clear existing filter params
  const filterKeys = [
    'search', 'minPrice', 'maxPrice', 'minYear', 'maxYear',
    'minMileage', 'maxMileage', 'country', 'condition', 'bodyType',
    'fuelType', 'transmission'
  ];
  filterKeys.forEach((key) => params.delete(key));

  // Set new filter params
  if (filters.search) params.set('search', filters.search);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minYear !== undefined) params.set('minYear', String(filters.minYear));
  if (filters.maxYear !== undefined) params.set('maxYear', String(filters.maxYear));
  if (filters.minMileage !== undefined) params.set('minMileage', String(filters.minMileage));
  if (filters.maxMileage !== undefined) params.set('maxMileage', String(filters.maxMileage));
  if (filters.country) params.set('country', filters.country);
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.bodyType) params.set('bodyType', filters.bodyType);
  if (filters.fuelType) params.set('fuelType', filters.fuelType);
  if (filters.transmission) params.set('transmission', filters.transmission);
}

/**
 * Convert FilterState to API filters format
 */
function toAPIFilters(filters: FilterState): Record<string, string | number | undefined> {
  const apiFilters: Record<string, string | number | undefined> = {};

  // Search maps to make filter (searches make/model via ILIKE)
  if (filters.search) {
    apiFilters.make = filters.search;
  }

  if (filters.minPrice !== undefined) apiFilters.minPrice = filters.minPrice;
  if (filters.maxPrice !== undefined) apiFilters.maxPrice = filters.maxPrice;
  if (filters.minYear !== undefined) apiFilters.minYear = filters.minYear;
  if (filters.maxYear !== undefined) apiFilters.maxYear = filters.maxYear;
  if (filters.minMileage !== undefined) apiFilters.minMileage = filters.minMileage;
  if (filters.maxMileage !== undefined) apiFilters.maxMileage = filters.maxMileage;
  if (filters.country) apiFilters.country = filters.country;
  if (filters.condition) apiFilters.condition = filters.condition;
  if (filters.bodyType) apiFilters.bodyType = filters.bodyType;
  if (filters.fuelType) apiFilters.fuelType = filters.fuelType;
  if (filters.transmission) apiFilters.transmission = filters.transmission;

  return apiFilters;
}

export function BuyerBrowseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Start with defaults - will update on mount from URL/localStorage
  const [groupBy, setGroupBy] = useState<GroupingField[]>([...DEFAULT_GROUPING_FIELDS]);
  const [pendingGroupBy, setPendingGroupBy] = useState<GroupingField[]>([...DEFAULT_GROUPING_FIELDS]);
  const [groupingInitialized, setGroupingInitialized] = useState(false);

  // Initialize groupBy from URL or localStorage on mount (client-side only)
  useEffect(() => {
    const urlGroupBy = searchParams.get('groupBy');
    if (urlGroupBy) {
      const fields = urlGroupBy.split(',') as GroupingField[];
      if (fields.length > 0) {
        setGroupBy(fields);
        setPendingGroupBy(fields);
        setGroupingInitialized(true);
        return;
      }
    }

    // Try localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroupBy(parsed);
          setPendingGroupBy(parsed);
          setGroupingInitialized(true);
          return;
        }
      } catch {
        // Ignore parse errors
      }
    }

    setGroupingInitialized(true);
  }, []);
  const [listings, setListings] = useState<GroupedListing[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state - start empty to avoid hydration mismatch, populate on mount
  const [filters, setFilters] = useState<FilterState>({});
  const [pendingFilters, setPendingFilters] = useState<FilterState>({});
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Initialize filters from URL on mount (client-side only)
  useEffect(() => {
    const urlFilters = parseFiltersFromURL(new URLSearchParams(searchParams.toString()));
    setFilters(urlFilters);
    setPendingFilters(urlFilters);
    setFiltersInitialized(true);
  }, []);

  const addItems = useCartStore((state) => state.addItems);

  // Fetch grouped listings
  const fetchListings = useCallback(
    async (
      fields: GroupingField[],
      currentFilters: FilterState,
      page: number = 1
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const apiFilters = toAPIFilters(currentFilters);
        const hasFilters = Object.keys(apiFilters).length > 0;

        const response = await fetch('/api/vehicles/grouped', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupBy: fields,
            filters: hasFilters ? apiFilters : undefined,
            page,
            limit: 20,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }

        const data: GroupedListingsResponse = await response.json();
        setListings(data.listings);
        setPagination(data.pagination);
        setTotalVehicles(data.totalVehicles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch when groupBy or filters change (only after both are initialized)
  useEffect(() => {
    if (filtersInitialized && groupingInitialized) {
      fetchListings(groupBy, filters, 1);
    }
  }, [groupBy, filters, filtersInitialized, groupingInitialized, fetchListings]);

  // Apply grouping changes
  const handleApplyGrouping = () => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingGroupBy));
    }

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('groupBy', pendingGroupBy.join(','));
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });

    // Apply and fetch
    setGroupBy(pendingGroupBy);
  };

  // Apply filter changes
  const handleApplyFilters = () => {
    // Update URL with filters
    const params = new URLSearchParams(searchParams.toString());
    serializeFiltersToURL(pendingFilters, params);
    params.delete('page'); // Reset to page 1 when filters change
    router.push(`?${params.toString()}`, { scroll: false });

    // Apply filters (this triggers the useEffect to fetch)
    setFilters(pendingFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setPendingFilters({});
    setFilters({});

    // Update URL to remove filter params
    const params = new URLSearchParams(searchParams.toString());
    serializeFiltersToURL({}, params);
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });

    fetchListings(groupBy, filters, newPage);
  };

  // Handle add to cart
  const handleAddToCart = (vehicles: CartVehicle[]) => {
    addItems(vehicles);
  };

  // Build description of current grouping
  const groupingDescription = groupBy
    .map((f) => f.charAt(0).toUpperCase() + f.slice(1))
    .join(' + ');

  // Count active filters for display
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.minYear !== undefined || filters.maxYear !== undefined) count++;
    if (filters.minMileage !== undefined || filters.maxMileage !== undefined) count++;
    if (filters.country) count++;
    if (filters.condition) count++;
    if (filters.bodyType) count++;
    if (filters.fuelType) count++;
    if (filters.transmission) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Grouping Selector */}
      <GroupingSelector
        value={pendingGroupBy}
        onChange={setPendingGroupBy}
        onApply={handleApplyGrouping}
        isLoading={isLoading}
      />

      {/* Search & Filters */}
      <SearchFilters
        value={pendingFilters}
        onChange={setPendingFilters}
        onApply={handleApplyFilters}
        isLoading={isLoading}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            <span>
              <strong>{formatNumber(pagination.total)}</strong> grouped listings
              {' • '}
              <strong>{formatNumber(totalVehicles)}</strong> total vehicles
              {' • '}
              Grouped by <span className="font-medium">{groupingDescription}</span>
              {activeFilterCount > 0 && (
                <>
                  {' • '}
                  <span className="text-primary font-medium">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        {!isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchListings(groupBy, filters, pagination.page)}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchListings(groupBy, filters, 1)}>Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4 animate-pulse">
                  <div className="w-24 h-24 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && listings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No vehicles found with the current filters.
            </p>
            <div className="flex justify-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setPendingGroupBy(DEFAULT_GROUPING_FIELDS);
                  setGroupBy(DEFAULT_GROUPING_FIELDS);
                }}
              >
                Reset Grouping
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listings Grid */}
      {!isLoading && !error && listings.length > 0 && (
        <div className="grid gap-4">
          {listings.map((listing, index) => (
            <GroupedListingCard
              key={`${listing.sellerId}-${index}`}
              listing={listing}
              groupedFields={groupBy}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

