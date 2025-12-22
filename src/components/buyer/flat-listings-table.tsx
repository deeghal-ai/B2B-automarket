'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ShoppingCart, 
  Car,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';
import { VehicleWithSellerInfo, FlatSortField, SortOrder } from '@/types/grouping';
import { formatPrice, formatMileage, truncateVin, conditionLabels } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
import type { CartVehicle } from '@/types';

interface FlatListingsTableProps {
  vehicles: VehicleWithSellerInfo[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sortBy: FlatSortField;
  sortOrder: SortOrder;
  onSortChange: (field: FlatSortField) => void;
  onPageChange: (page: number) => void;
}

interface ColumnDef {
  key: FlatSortField | 'checkbox' | 'image' | 'vehicle' | 'color' | 'seller' | 'condition' | 'actions';
  label: string;
  sortable: boolean;
  sortField?: FlatSortField;
  className?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'checkbox', label: '', sortable: false, className: 'w-12' },
  { key: 'image', label: 'Image', sortable: false, className: 'w-16' },
  { key: 'vehicle', label: 'Vehicle', sortable: true, sortField: 'make' },
  { key: 'year', label: 'Year', sortable: true, sortField: 'year' },
  { key: 'color', label: 'Color', sortable: false },
  { key: 'mileage', label: 'Mileage', sortable: true, sortField: 'mileage' },
  { key: 'price', label: 'Price', sortable: true, sortField: 'price' },
  { key: 'condition', label: 'Condition', sortable: false },
  { key: 'seller', label: 'Seller', sortable: false },
  { key: 'actions', label: '', sortable: false, className: 'text-right' },
];

export function FlatListingsTable({
  vehicles,
  isLoading,
  pagination,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
}: FlatListingsTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  const cartItems = useCartStore((state) => state.items);
  const addItems = useCartStore((state) => state.addItems);
  
  const cartVehicleIds = useMemo(
    () => new Set(cartItems.map((item) => item.id)),
    [cartItems]
  );

  const allSelected = vehicles.length > 0 && vehicles.every((v) => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(vehicles.map((v) => v.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (vehicleId: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(vehicleId);
    } else {
      newSet.delete(vehicleId);
    }
    setSelectedIds(newSet);
  };

  const handleSortClick = (column: ColumnDef) => {
    if (!column.sortable || !column.sortField) return;
    onSortChange(column.sortField);
  };

  const vehicleToCartItem = (vehicle: VehicleWithSellerInfo): CartVehicle => ({
    id: vehicle.id,
    sellerId: vehicle.sellerId,
    sellerName: vehicle.sellerName,
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant,
    year: vehicle.year,
    color: vehicle.color,
    mileage: vehicle.mileage,
    price: vehicle.price,
    currency: vehicle.currency,
    incoterm: vehicle.incoterm,
    vin: vehicle.vin,
    imageUrl: vehicle.primaryImage,
  });

  const handleAddSingle = async (vehicle: VehicleWithSellerInfo) => {
    if (cartVehicleIds.has(vehicle.id)) return;
    
    setAddingToCart(vehicle.id);
    addItems([vehicleToCartItem(vehicle)]);
    
    // Show success state briefly
    setJustAdded((prev) => new Set(prev).add(vehicle.id));
    setTimeout(() => {
      setJustAdded((prev) => {
        const next = new Set(prev);
        next.delete(vehicle.id);
        return next;
      });
    }, 2000);
    
    setAddingToCart(null);
  };

  const handleBulkAdd = async () => {
    const selectedVehicles = vehicles.filter((v) => selectedIds.has(v.id) && !cartVehicleIds.has(v.id));
    if (selectedVehicles.length === 0) return;

    setBulkAdding(true);
    const cartVehicles = selectedVehicles.map(vehicleToCartItem);
    addItems(cartVehicles);
    
    // Show success state
    setJustAdded((prev) => {
      const next = new Set(prev);
      selectedVehicles.forEach((v) => next.add(v.id));
      return next;
    });
    setTimeout(() => {
      setJustAdded(new Set());
    }, 2000);

    setSelectedIds(new Set());
    setBulkAdding(false);
  };

  const renderSortIcon = (column: ColumnDef) => {
    if (!column.sortable || !column.sortField) return null;
    
    if (sortBy === column.sortField) {
      return sortOrder === 'asc' ? (
        <ArrowUp className="h-4 w-4 ml-1" />
      ) : (
        <ArrowDown className="h-4 w-4 ml-1" />
      );
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-30" />;
  };

  const { page, totalPages, total, limit } = pagination;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Count how many selected are already in cart
  const selectedInCartCount = Array.from(selectedIds).filter((id) => cartVehicleIds.has(id)).length;
  const selectedNotInCartCount = selectedIds.size - selectedInCartCount;

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-3 flex items-center justify-between shadow-sm">
          <span className="text-sm font-medium">
            {selectedIds.size} vehicle{selectedIds.size > 1 ? 's' : ''} selected
            {selectedInCartCount > 0 && (
              <span className="text-muted-foreground ml-1">
                ({selectedInCartCount} already in cart)
              </span>
            )}
          </span>
          <Button
            size="sm"
            onClick={handleBulkAdd}
            disabled={bulkAdding || selectedNotInCartCount === 0}
          >
            {bulkAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add {selectedNotInCartCount} to Cart
              </>
            )}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableHead
                  key={column.key}
                  className={`${column.className || ''} ${column.sortable ? 'cursor-pointer select-none hover:bg-muted/50' : ''}`}
                  onClick={() => handleSortClick(column)}
                >
                  {column.key === 'checkbox' ? (
                    <Checkbox
                      checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                      disabled={isLoading}
                    />
                  ) : (
                    <div className="flex items-center">
                      {column.label}
                      {renderSortIcon(column)}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="w-12 h-12 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-12 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell><div className="h-8 w-20 bg-muted rounded animate-pulse" /></TableCell>
                </TableRow>
              ))
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Car className="h-8 w-8" />
                    <span>No vehicles found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => {
                const isInCart = cartVehicleIds.has(vehicle.id);
                const wasJustAdded = justAdded.has(vehicle.id);
                const isSelected = selectedIds.has(vehicle.id);
                
                return (
                  <TableRow
                    key={vehicle.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className={`cursor-pointer ${isInCart ? 'bg-primary/5' : ''}`}
                    onClick={() => router.push(`/buyer/vehicle/${vehicle.id}`)}
                  >
                    {/* Checkbox */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(vehicle.id, checked as boolean)}
                        aria-label={`Select ${vehicle.make} ${vehicle.model}`}
                      />
                    </TableCell>

                    {/* Image */}
                    <TableCell>
                      {vehicle.primaryImage ? (
                        <img
                          src={vehicle.primaryImage}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Car className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>

                    {/* Vehicle */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-medium">
                            {vehicle.make} {vehicle.model}
                          </span>
                          {vehicle.variant && (
                            <span className="text-muted-foreground ml-1">
                              {vehicle.variant}
                            </span>
                          )}
                        </div>
                        {isInCart && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            In Cart
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        VIN: {truncateVin(vehicle.vin)}
                      </div>
                    </TableCell>

                    {/* Year */}
                    <TableCell>{vehicle.year}</TableCell>

                    {/* Color */}
                    <TableCell>{vehicle.color}</TableCell>

                    {/* Mileage */}
                    <TableCell>{formatMileage(vehicle.mileage)}</TableCell>

                    {/* Price */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">
                          {formatPrice(vehicle.price, vehicle.currency ?? undefined)}
                        </span>
                        {vehicle.incoterm && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            {vehicle.incoterm}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Condition */}
                    <TableCell>
                      <Badge variant="outline">
                        {conditionLabels[vehicle.condition] || vehicle.condition}
                      </Badge>
                    </TableCell>

                    {/* Seller */}
                    <TableCell>
                      <span className="text-sm">{vehicle.sellerName}</span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant={wasJustAdded ? 'default' : isInCart ? 'outline' : 'default'}
                        disabled={addingToCart === vehicle.id || isInCart}
                        onClick={() => handleAddSingle(vehicle)}
                        className={wasJustAdded ? 'bg-green-600 hover:bg-green-600' : ''}
                      >
                        {addingToCart === vehicle.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : wasJustAdded ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Added
                          </>
                        ) : isInCart ? (
                          'In Cart'
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {total} vehicles
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

