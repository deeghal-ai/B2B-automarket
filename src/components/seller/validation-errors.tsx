'use client';

import { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ValidationError } from '@/types/upload';

interface ValidationErrorsProps {
  errors: ValidationError[];
  maxDisplay?: number;
}

export function ValidationErrors({ errors, maxDisplay = 50 }: ValidationErrorsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (errors.length === 0) {
    return null;
  }

  // Group errors by row
  const errorsByRow = errors.reduce((acc, error) => {
    if (!acc[error.row]) {
      acc[error.row] = [];
    }
    acc[error.row].push(error);
    return acc;
  }, {} as Record<number, ValidationError[]>);

  const rowNumbers = Object.keys(errorsByRow).map(Number).sort((a, b) => a - b);
  const displayRows = rowNumbers.slice(0, maxDisplay);
  const hasMoreRows = rowNumbers.length > maxDisplay;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-950/30"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>View {errors.length} validation error{errors.length > 1 ? 's' : ''}</span>
            <Badge variant="secondary" className="ml-2">
              {rowNumbers.length} row{rowNumbers.length > 1 ? 's' : ''} affected
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[80px,1fr,2fr] gap-4 bg-muted/50 px-4 py-2 text-sm font-medium border-b">
            <div>Row</div>
            <div>Field</div>
            <div>Error</div>
          </div>

          {/* Error rows */}
          <div className="divide-y max-h-[300px] overflow-y-auto">
            {displayRows.map((rowNum) => (
              <div key={rowNum} className="divide-y divide-dashed">
                {errorsByRow[rowNum].map((error, idx) => (
                  <div
                    key={`${rowNum}-${idx}`}
                    className="grid grid-cols-[80px,1fr,2fr] gap-4 px-4 py-2 text-sm hover:bg-muted/30"
                  >
                    <div className="font-mono text-muted-foreground">
                      {idx === 0 ? rowNum : ''}
                    </div>
                    <div className="font-medium text-foreground">
                      {error.field}
                    </div>
                    <div className="text-muted-foreground">
                      {error.message}
                      {error.value !== undefined && error.value !== '' && (
                        <span className="ml-2 text-xs text-red-500 dark:text-red-400">
                          (got: {String(error.value).substring(0, 30)}
                          {String(error.value).length > 30 ? '...' : ''})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Show more indicator */}
          {hasMoreRows && (
            <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/30 border-t">
              ... and {rowNumbers.length - maxDisplay} more rows with errors
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

