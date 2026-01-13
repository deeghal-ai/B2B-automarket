'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { ViewModeToggle, ViewMode } from './view-mode-toggle';
import { GroupingSelector } from './grouping-selector';
import { GroupedListingCard } from './grouped-listing-card';
import { FlatListingsTable } from './flat-listings-table';
import { SearchFilters, FilterState } from './search-filters';
import { useCartStore } from '@/stores/cart-store';
import {
  GroupingField,
  GroupedListing,
  GroupedListingsResponse,
  VehicleWithSellerInfo,
  FlatListingsResponse,
  FlatSortField,
  SortOrder,
  DEFAULT_GROUPING_FIELDS,
} from '@/types/grouping';
import type { CartVehicle } from '@/types';
import { formatNumber } from '@/lib/utils';

const STORAGE_KEY = 'buyer-grouping-preference';
const VIEW_MODE_STORAGE_KEY = 'buyer-view-mode-preference';

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

const VALID_SORT_FIELDS: FlatSortField[] = ['make', 'model', 'year', 'price', 'mileage', 'createdAt'];

export function BuyerBrowseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('flat');
  const [viewModeInitialized, setViewModeInitialized] = useState(false);
  
  // View modes to disable (empty array = all modes enabled)
  const DISABLED_VIEW_MODES: ViewMode[] = [];

  // Grouping state (for grouped view)
  const [groupBy, setGroupBy] = useState<GroupingField[]>([...DEFAULT_GROUPING_FIELDS]);
  const [pendingGroupBy, setPendingGroupBy] = useState<GroupingField[]>([...DEFAULT_GROUPING_FIELDS]);
  const [groupingInitialized, setGroupingInitialized] = useState(false);

  // Sort state (for flat view)
  const [sortBy, setSortBy] = useState<FlatSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Grouped listings state
  const [listings, setListings] = useState<GroupedListing[]>([]);
  const [groupedPagination, setGroupedPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [totalVehicles, setTotalVehicles] = useState(0);

  // Flat listings state
  const [flatVehicles, setFlatVehicles] = useState<VehicleWithSellerInfo[]>([]);
  const [flatPagination, setFlatPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Shared state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({});
  const [pendingFilters, setPendingFilters] = useState<FilterState>({});
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Initialize all state from URL on mount
  useEffect(() => {
    // View mode from URL or localStorage
    // Note: If 'grouped' mode is disabled, always default to 'flat'
    const urlView = searchParams.get('view');
    if (urlView === 'flat' || urlView === 'grouped') {
      // If grouped is disabled, force to flat
      if (urlView === 'grouped' && DISABLED_VIEW_MODES.includes('grouped')) {
        setViewMode('flat');
      } else {
        setViewMode(urlView);
      }
    } else {
      const storedView = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (storedView === 'flat' || storedView === 'grouped') {
        // If grouped is disabled, force to flat
        if (storedView === 'grouped' && DISABLED_VIEW_MODES.includes('grouped')) {
          setViewMode('flat');
        } else {
          setViewMode(storedView as ViewMode);
        }
      }
    }
    setViewModeInitialized(true);

    // Grouping from URL or localStorage
    const urlGroupBy = searchParams.get('groupBy');
    if (urlGroupBy) {
      const fields = urlGroupBy.split(',') as GroupingField[];
      if (fields.length > 0) {
        setGroupBy(fields);
        setPendingGroupBy(fields);
      }
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGroupBy(parsed);
            setPendingGroupBy(parsed);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
    setGroupingInitialized(true);

    // Sort params from URL (for flat view)
    const urlSortBy = searchParams.get('sortBy');
    if (urlSortBy && VALID_SORT_FIELDS.includes(urlSortBy as FlatSortField)) {
      setSortBy(urlSortBy as FlatSortField);
    }
    const urlSortOrder = searchParams.get('sortOrder');
    if (urlSortOrder === 'asc' || urlSortOrder === 'desc') {
      setSortOrder(urlSortOrder);
    }

    // Filters from URL
    const urlFilters = parseFiltersFromURL(new URLSearchParams(searchParams.toString()));
    setFilters(urlFilters);
    setPendingFilters(urlFilters);
    setFiltersInitialized(true);
  }, []);

  const addItems = useCartStore((state) => state.addItems);

  // Fetch grouped listings
  const fetchGroupedListings = useCallback(
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
        setGroupedPagination(data.pagination);
        setTotalVehicles(data.totalVehicles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch flat listings
  const fetchFlatListings = useCallback(
    async (
      currentFilters: FilterState,
      currentSortBy: FlatSortField,
      currentSortOrder: SortOrder,
      page: number = 1
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const apiFilters = toAPIFilters(currentFilters);
        const hasFilters = Object.keys(apiFilters).length > 0;

        const response = await fetch('/api/vehicles/flat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: hasFilters ? apiFilters : undefined,
            sortBy: currentSortBy,
            sortOrder: currentSortOrder,
            page,
            limit: 50,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }

        const data: FlatListingsResponse = await response.json();
        setFlatVehicles(data.vehicles);
        setFlatPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Fetch based on current view mode when state changes
  useEffect(() => {
    if (!filtersInitialized || !groupingInitialized || !viewModeInitialized) return;

    if (viewMode === 'grouped') {
      fetchGroupedListings(groupBy, filters, 1);
    } else {
      fetchFlatListings(filters, sortBy, sortOrder, 1);
    }
  }, [viewMode, groupBy, filters, sortBy, sortOrder, filtersInitialized, groupingInitialized, viewModeInitialized, fetchGroupedListings, fetchFlatListings]);

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    // Save to localStorage
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    params.delete('page');
    
    // Add/remove sort params based on mode
    if (mode === 'flat') {
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
    } else {
      params.delete('sortBy');
      params.delete('sortOrder');
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
    setViewMode(mode);
  };

  // Apply grouping changes
  const handleApplyGrouping = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingGroupBy));

    const params = new URLSearchParams(searchParams.toString());
    params.set('groupBy', pendingGroupBy.join(','));
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });

    setGroupBy(pendingGroupBy);
  };

  // Apply filter changes
  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    serializeFiltersToURL(pendingFilters, params);
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });

    setFilters(pendingFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setPendingFilters({});
    setFilters({});

    const params = new URLSearchParams(searchParams.toString());
    serializeFiltersToURL({}, params);
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle grouped pagination
  const handleGroupedPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });

    fetchGroupedListings(groupBy, filters, newPage);
  };

  // Handle flat pagination
  const handleFlatPageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });

    fetchFlatListings(filters, sortBy, sortOrder, newPage);
  };

  // Handle sort change for flat view
  const handleSortChange = (field: FlatSortField) => {
    const newSortOrder: SortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', field);
    params.set('sortOrder', newSortOrder);
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });

    setSortBy(field);
    setSortOrder(newSortOrder);
  };

  // Handle add to cart (grouped view)
  const handleAddToCart = (vehicles: CartVehicle[]) => {
    addItems(vehicles);
  };

  // Handle refresh
  const handleRefresh = () => {
    if (viewMode === 'grouped') {
      fetchGroupedListings(groupBy, filters, groupedPagination.page);
    } else {
      fetchFlatListings(filters, sortBy, sortOrder, flatPagination.page);
    }
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

  const currentPagination = viewMode === 'grouped' ? groupedPagination : flatPagination;
  const totalCount = viewMode === 'grouped' ? totalVehicles : flatPagination.total;

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <ViewModeToggle
          value={viewMode}
          onChange={handleViewModeChange}
          disabled={isLoading}
          disabledModes={DISABLED_VIEW_MODES}
        />
        
        {!isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {/* Grouping Selector (only in grouped view) */}
      {viewMode === 'grouped' && (
        <GroupingSelector
          value={pendingGroupBy}
          onChange={setPendingGroupBy}
          onApply={handleApplyGrouping}
          isLoading={isLoading}
        />
      )}

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
          ) : viewMode === 'grouped' ? (
            <span>
              <strong>{formatNumber(groupedPagination.total)}</strong> grouped listings
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
          ) : (
            <span>
              <strong>{formatNumber(flatPagination.total)}</strong> vehicles
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
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* Grouped View */}
      {viewMode === 'grouped' && (
        <>
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
          {!isLoading && !error && groupedPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGroupedPageChange(groupedPagination.page - 1)}
                disabled={groupedPagination.page === 1}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground px-4">
                Page {groupedPagination.page} of {groupedPagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGroupedPageChange(groupedPagination.page + 1)}
                disabled={groupedPagination.page === groupedPagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Flat View */}
      {viewMode === 'flat' && (
        <>
          {/* Empty State */}
          {!isLoading && !error && flatVehicles.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No vehicles found with the current filters.
                </p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Flat Table */}
          {!error && (isLoading || flatVehicles.length > 0) && (
            <FlatListingsTable
              vehicles={flatVehicles}
              isLoading={isLoading}
              pagination={flatPagination}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              onPageChange={handleFlatPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
