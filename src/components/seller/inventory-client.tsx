'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VehicleStatus } from '@prisma/client';
import { InventoryFilters } from './inventory-filters';
import { InventoryTable } from './inventory-table';
import { BulkActions } from './bulk-actions';
import { VehicleWithImage, VehiclesResponse } from '@/types/inventory';
import { Loader2 } from 'lucide-react';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function InventoryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL params
  const initialStatus = (searchParams.get('status') as VehicleStatus | 'ALL') || 'ALL';
  const initialSearch = searchParams.get('search') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  // Local state
  const [status, setStatus] = useState<VehicleStatus | 'ALL'>(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Data state
  const [vehicles, setVehicles] = useState<VehicleWithImage[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 50,
  });
  const [loading, setLoading] = useState(true);

  // Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // Build URL and fetch data
  const fetchVehicles = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (status !== 'ALL') params.set('status', status);
    if (debouncedSearch) params.set('search', debouncedSearch);

    try {
      const response = await fetch(`/api/seller/vehicles?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data: VehiclesResponse = await response.json();
      setVehicles(data.vehicles);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (status !== 'ALL') params.set('status', status);
    if (debouncedSearch) params.set('search', debouncedSearch);

    const query = params.toString();
    router.replace(`/seller/inventory${query ? `?${query}` : ''}`, { scroll: false });
  }, [page, status, debouncedSearch, router]);

  // Fetch on mount and when params change
  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  // Handlers
  const handleStatusFilterChange = (newStatus: VehicleStatus | 'ALL') => {
    setStatus(newStatus);
    setSelectedIds([]);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setSelectedIds([]);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelectedIds([]);
  };

  const handleVehicleStatusChange = (vehicleId: string, newStatus: VehicleStatus) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status: newStatus } : v))
    );
  };

  const handleVehicleDelete = (vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    setSelectedIds((prev) => prev.filter((id) => id !== vehicleId));
    setPagination((prev) => ({ ...prev, totalCount: prev.totalCount - 1 }));
  };

  const handleBulkActionComplete = () => {
    fetchVehicles();
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      <InventoryFilters
        status={status}
        search={search}
        onStatusChange={handleStatusFilterChange}
        onSearchChange={handleSearchChange}
      />

      <BulkActions
        selectedIds={selectedIds}
        onActionComplete={handleBulkActionComplete}
        onClearSelection={handleClearSelection}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <InventoryTable
          vehicles={vehicles}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onStatusChange={handleVehicleStatusChange}
          onDelete={handleVehicleDelete}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

