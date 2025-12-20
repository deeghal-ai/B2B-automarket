'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { GroupingSelector } from './grouping-selector';
import { GroupedListingCard } from './grouped-listing-card';
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

export function BuyerBrowseClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse initial groupBy from URL or localStorage
  const getInitialGroupBy = (): GroupingField[] => {
    const urlGroupBy = searchParams.get('groupBy');
    if (urlGroupBy) {
      const fields = urlGroupBy.split(',') as GroupingField[];
      if (fields.length > 0) return fields;
    }

    // Try localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // Ignore parse errors
        }
      }
    }

    return [...DEFAULT_GROUPING_FIELDS];
  };

  const [groupBy, setGroupBy] = useState<GroupingField[]>(getInitialGroupBy);
  const [pendingGroupBy, setPendingGroupBy] = useState<GroupingField[]>(getInitialGroupBy);
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

  const addItems = useCartStore((state) => state.addItems);

  // Fetch grouped listings
  const fetchListings = useCallback(async (fields: GroupingField[], page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vehicles/grouped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupBy: fields,
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
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchListings(groupBy, 1);
  }, [groupBy, fetchListings]);

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

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`?${params.toString()}`, { scroll: false });

    fetchListings(groupBy, newPage);
  };

  // Handle add to cart
  const handleAddToCart = (vehicles: CartVehicle[]) => {
    addItems(vehicles);
  };

  // Build description of current grouping
  const groupingDescription = groupBy
    .map((f) => f.charAt(0).toUpperCase() + f.slice(1))
    .join(' + ');

  return (
    <div className="space-y-6">
      {/* Grouping Selector */}
      <GroupingSelector
        value={pendingGroupBy}
        onChange={setPendingGroupBy}
        onApply={handleApplyGrouping}
        isLoading={isLoading}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
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
            </span>
          )}
        </div>

        {!isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchListings(groupBy, pagination.page)}
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
            <Button onClick={() => fetchListings(groupBy, 1)}>Try Again</Button>
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
              No vehicles available with the current grouping.
            </p>
            <Button variant="outline" onClick={() => setPendingGroupBy(DEFAULT_GROUPING_FIELDS)}>
              Reset Grouping
            </Button>
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

