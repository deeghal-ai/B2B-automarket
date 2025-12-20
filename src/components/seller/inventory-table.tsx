'use client';

import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusToggle } from './status-toggle';
import { VehicleWithImage } from '@/types/inventory';
import { VehicleStatus } from '@prisma/client';
import { formatPrice, truncateVin, vehicleStatusLabels } from '@/lib/utils';
import { Trash2, Loader2, Car, ChevronLeft, ChevronRight } from 'lucide-react';

interface InventoryTableProps {
  vehicles: VehicleWithImage[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onStatusChange: (vehicleId: string, newStatus: VehicleStatus) => void;
  onDelete: (vehicleId: string) => void;
  pagination: {
    page: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
  };
  onPageChange: (page: number) => void;
}

const statusVariants: Record<VehicleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PUBLISHED: 'default',
  DRAFT: 'secondary',
  SOLD: 'outline',
  RESERVED: 'outline',
};

export function InventoryTable({
  vehicles,
  selectedIds,
  onSelectionChange,
  onStatusChange,
  onDelete,
  pagination,
  onPageChange,
}: InventoryTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleWithImage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const allSelected = vehicles.length > 0 && vehicles.every((v) => selectedIds.includes(v.id));
  const someSelected = vehicles.some((v) => selectedIds.includes(v.id)) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = [...new Set([...selectedIds, ...vehicles.map((v) => v.id)])];
      onSelectionChange(newIds);
    } else {
      const vehicleIds = vehicles.map((v) => v.id);
      onSelectionChange(selectedIds.filter((id) => !vehicleIds.includes(id)));
    }
  };

  const handleSelectOne = (vehicleId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, vehicleId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== vehicleId));
    }
  };

  const handleDeleteClick = (vehicle: VehicleWithImage) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/seller/vehicles/${vehicleToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      onDelete(vehicleToDelete.id);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const { page, totalPages, totalCount, itemsPerPage } = pagination;
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalCount);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement).dataset.state = someSelected ? 'indeterminate' : undefined;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Car className="h-8 w-8" />
                    <span>No vehicles found</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle.id} data-state={selectedIds.includes(vehicle.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(vehicle.id)}
                      onCheckedChange={(checked) => handleSelectOne(vehicle.id, checked as boolean)}
                      aria-label={`Select ${vehicle.make} ${vehicle.model}`}
                    />
                  </TableCell>
                  <TableCell>
                    {vehicle.images[0]?.url ? (
                      <img
                        src={vehicle.images[0].url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Car className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </span>
                      {vehicle.variant && (
                        <span className="text-muted-foreground ml-1">{vehicle.variant}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{vehicle.color}</div>
                  </TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{formatPrice(Number(vehicle.price), vehicle.currency)}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {truncateVin(vehicle.vin)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[vehicle.status]}>
                      {vehicleStatusLabels[vehicle.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <StatusToggle
                        vehicleId={vehicle.id}
                        currentStatus={vehicle.status}
                        onStatusChange={onStatusChange}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(vehicle)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {totalCount} vehicles
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete vehicle?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {vehicleToDelete?.make} {vehicleToDelete?.model} ({vehicleToDelete?.year})
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

