'use client';

import { LayoutGrid, TableIcon } from 'lucide-react';

export type ViewMode = 'grouped' | 'flat';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  disabled?: boolean;
}

export function ViewModeToggle({ value, onChange, disabled }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/50 p-1">
      <button
        type="button"
        onClick={() => onChange('grouped')}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          value === 'grouped'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <LayoutGrid className="h-4 w-4" />
        Grouped
      </button>
      <button
        type="button"
        onClick={() => onChange('flat')}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          value === 'flat'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <TableIcon className="h-4 w-4" />
        Flat
      </button>
    </div>
  );
}

