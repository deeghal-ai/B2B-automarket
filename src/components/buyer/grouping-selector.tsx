'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GroupingField, VALID_GROUPING_FIELDS } from '@/types/grouping';
import { Settings2 } from 'lucide-react';

const GROUPING_OPTIONS: { field: GroupingField; label: string }[] = [
  { field: 'make', label: 'Make' },
  { field: 'model', label: 'Model' },
  { field: 'variant', label: 'Variant' },
  { field: 'year', label: 'Year' },
  { field: 'color', label: 'Color' },
  { field: 'condition', label: 'Condition' },
  { field: 'bodyType', label: 'Body Type' },
];

interface Props {
  value: GroupingField[];
  onChange: (fields: GroupingField[]) => void;
  onApply?: () => void;
  isLoading?: boolean;
}

export function GroupingSelector({ value, onChange, onApply, isLoading }: Props) {
  const toggle = (field: GroupingField) => {
    if (value.includes(field)) {
      // Don't allow removing if it's the last one
      if (value.length > 1) {
        onChange(value.filter((f) => f !== field));
      }
    } else {
      onChange([...value, field]);
    }
  };

  const selectAll = () => {
    onChange([...VALID_GROUPING_FIELDS]);
  };

  const selectDefault = () => {
    onChange(['make', 'model', 'year']);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Group vehicles by:</span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {GROUPING_OPTIONS.map(({ field, label }) => (
            <label
              key={field}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <Checkbox
                checked={value.includes(field)}
                onCheckedChange={() => toggle(field)}
                disabled={isLoading}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={onApply}
            disabled={isLoading || value.length === 0}
          >
            {isLoading ? 'Loading...' : 'Apply Grouping'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectDefault}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={isLoading}
          >
            Select All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

