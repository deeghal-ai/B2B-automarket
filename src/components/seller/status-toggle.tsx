'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VehicleStatus } from '@prisma/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface StatusToggleProps {
  vehicleId: string;
  currentStatus: VehicleStatus;
  onStatusChange: (vehicleId: string, newStatus: VehicleStatus) => void;
}

export function StatusToggle({
  vehicleId,
  currentStatus,
  onStatusChange,
}: StatusToggleProps) {
  const [loading, setLoading] = useState(false);

  const isPublished = currentStatus === 'PUBLISHED';
  const isSoldOrReserved = currentStatus === 'SOLD' || currentStatus === 'RESERVED';

  const handleToggle = async () => {
    if (isSoldOrReserved) return;

    const newStatus = isPublished ? VehicleStatus.DRAFT : VehicleStatus.PUBLISHED;
    setLoading(true);

    try {
      const response = await fetch(`/api/seller/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      onStatusChange(vehicleId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      // Could add toast notification here
    } finally {
      setLoading(false);
    }
  };

  if (isSoldOrReserved) {
    return null; // No toggle for sold/reserved vehicles
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPublished ? (
        <>
          <EyeOff className="h-4 w-4" />
          <span className="hidden sm:inline">Unpublish</span>
        </>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Publish</span>
        </>
      )}
    </Button>
  );
}

