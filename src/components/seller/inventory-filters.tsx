'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VehicleStatus } from '@prisma/client';
import { vehicleStatusLabels } from '@/lib/utils';

interface InventoryFiltersProps {
  status: VehicleStatus | 'ALL';
  search: string;
  onStatusChange: (status: VehicleStatus | 'ALL') => void;
  onSearchChange: (search: string) => void;
}

export function InventoryFilters({
  status,
  search,
  onStatusChange,
  onSearchChange,
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Status:
        </span>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            {Object.values(VehicleStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {vehicleStatusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by make, model, or VIN..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}

