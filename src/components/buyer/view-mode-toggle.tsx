'use client';

import { LayoutGrid, TableIcon } from 'lucide-react';

export type ViewMode = 'grouped' | 'flat';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
  /** Modes to disable (they remain visible but non-clickable with "Coming Soon" hint) */
  disabledModes?: ViewMode[];
}

export function ViewModeToggle({ value, onChange, disabled, disabledModes = [] }: ViewModeToggleProps) {
  const isGroupedDisabled = disabledModes.includes('grouped');
  const isFlatDisabled = disabledModes.includes('flat');

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/50 p-1">
      <button
        type="button"
        onClick={() => !isGroupedDisabled && onChange('grouped')}
        disabled={disabled || isGroupedDisabled}
        title={isGroupedDisabled ? 'Coming Soon' : undefined}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          value === 'grouped' && !isGroupedDisabled
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled || isGroupedDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <LayoutGrid className="h-4 w-4" />
        Grouped
        {isGroupedDisabled && (
          <span className="text-[10px] uppercase tracking-wide opacity-70">(Soon)</span>
        )}
      </button>
      <button
        type="button"
        onClick={() => !isFlatDisabled && onChange('flat')}
        disabled={disabled || isFlatDisabled}
        title={isFlatDisabled ? 'Coming Soon' : undefined}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          value === 'flat' && !isFlatDisabled
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled || isFlatDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <TableIcon className="h-4 w-4" />
        Flat
        {isFlatDisabled && (
          <span className="text-[10px] uppercase tracking-wide opacity-70">(Soon)</span>
        )}
      </button>
    </div>
  );
}

