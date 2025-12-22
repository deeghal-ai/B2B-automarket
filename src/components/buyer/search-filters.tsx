'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  conditionLabels,
  bodyTypeLabels,
  fuelTypeLabels,
  transmissionLabels,
} from '@/lib/utils';

/**
 * Filter state matching the API's GroupingFilters interface
 */
export interface FilterState {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  country?: string;
  condition?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
}

interface SearchFiltersProps {
  value: FilterState;
  onChange: (filters: FilterState) => void;
  onApply: () => void;
  isLoading?: boolean;
}

const COUNTRIES = [
  { value: 'all', label: 'All' },
  { value: 'China', label: 'China' },
  { value: 'United Arab Emirates', label: 'UAE' },
  { value: 'Japan', label: 'Japan' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'Germany', label: 'Germany' },
  { value: 'United States', label: 'USA' },
];

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function SearchFilters({
  value,
  onChange,
  onApply,
  isLoading = false,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [mounted, setMounted] = useState(false);

  // Track if component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true);
    if (value.search) {
      setSearchInput(value.search);
    }
  }, []);

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filter when debounced search changes (only after mount)
  useEffect(() => {
    if (mounted && debouncedSearch !== value.search) {
      onChange({ ...value, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, mounted]);

  // Sync searchInput with external value changes
  useEffect(() => {
    if (mounted && value.search !== searchInput && value.search !== undefined) {
      setSearchInput(value.search);
    }
  }, [value.search, mounted]);

  // Count active filters
  const countActiveFilters = useCallback(() => {
    let count = 0;
    if (value.search) count++;
    if (value.minPrice !== undefined || value.maxPrice !== undefined) count++;
    if (value.minYear !== undefined || value.maxYear !== undefined) count++;
    if (value.minMileage !== undefined || value.maxMileage !== undefined) count++;
    if (value.country) count++;
    if (value.condition) count++;
    if (value.bodyType) count++;
    if (value.fuelType) count++;
    if (value.transmission) count++;
    return count;
  }, [value]);

  const activeFilterCount = countActiveFilters();

  // Handle numeric input change
  const handleNumericChange = (
    field: keyof FilterState,
    inputValue: string
  ) => {
    const numValue = inputValue ? parseInt(inputValue, 10) : undefined;
    onChange({ ...value, [field]: isNaN(numValue as number) ? undefined : numValue });
  };

  // Handle select change (convert 'all' to undefined)
  const handleSelectChange = (field: keyof FilterState, val: string) => {
    onChange({ ...value, [field]: val === 'all' ? undefined : val });
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchInput('');
    onChange({});
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center justify-between gap-4 py-2 px-3 bg-muted/50 rounded-lg border border-dashed">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2 h-8"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
          {isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <X className="h-3 w-3 mr-1" />
            <span className="text-xs">Clear</span>
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-3">
        <div className="p-4 bg-card rounded-lg border space-y-4">
          {/* Search - Full width */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by make or model..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          {/* Grid of filters - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Price Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Price ($)
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={value.minPrice ?? ''}
                  onChange={(e) => handleNumericChange('minPrice', e.target.value)}
                  className="h-8 text-sm px-2"
                  min={0}
                />
                <span className="text-muted-foreground text-xs">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={value.maxPrice ?? ''}
                  onChange={(e) => handleNumericChange('maxPrice', e.target.value)}
                  className="h-8 text-sm px-2"
                  min={0}
                />
              </div>
            </div>

            {/* Year Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Year
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={value.minYear ?? ''}
                  onChange={(e) => handleNumericChange('minYear', e.target.value)}
                  className="h-8 text-sm px-2"
                  min={1990}
                  max={2030}
                />
                <span className="text-muted-foreground text-xs">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={value.maxYear ?? ''}
                  onChange={(e) => handleNumericChange('maxYear', e.target.value)}
                  className="h-8 text-sm px-2"
                  min={1990}
                  max={2030}
                />
              </div>
            </div>

            {/* Mileage Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Mileage (km)
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={value.minMileage ?? ''}
                  onChange={(e) => handleNumericChange('minMileage', e.target.value)}
                  className="h-8 text-sm px-2"
                  min={0}
                />
                <span className="text-muted-foreground text-xs">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={value.maxMileage ?? ''}
                  onChange={(e) => handleNumericChange('maxMileage', e.target.value)}
                  className="h-8 text-sm px-2"
                  min={0}
                />
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Country
              </label>
              <Select
                value={value.country || 'all'}
                onValueChange={(val) => handleSelectChange('country', val)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condition */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Condition
              </label>
              <Select
                value={value.condition || 'all'}
                onValueChange={(val) => handleSelectChange('condition', val)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(conditionLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Body Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Body Type
              </label>
              <Select
                value={value.bodyType || 'all'}
                onValueChange={(val) => handleSelectChange('bodyType', val)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(bodyTypeLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fuel Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Fuel Type
              </label>
              <Select
                value={value.fuelType || 'all'}
                onValueChange={(val) => handleSelectChange('fuelType', val)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(fuelTypeLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transmission */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Transmission
              </label>
              <Select
                value={value.transmission || 'all'}
                onValueChange={(val) => handleSelectChange('transmission', val)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(transmissionLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-end">
            <Button size="sm" onClick={onApply} disabled={isLoading} className="h-8">
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
