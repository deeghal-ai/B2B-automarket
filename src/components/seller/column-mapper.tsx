'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  VehicleField,
  VEHICLE_FIELDS,
  VEHICLE_FIELD_LABELS,
  REQUIRED_VEHICLE_FIELDS,
  ColumnMappingState,
  MappingValidation,
} from '@/types/upload';
import { autoDetectMapping } from '@/lib/column-auto-detect';

interface ColumnMapperProps {
  headers: string[];
  initialMapping?: ColumnMappingState;
  onChange: (mapping: ColumnMappingState, validation: MappingValidation) => void;
}

export function ColumnMapper({ headers, initialMapping, onChange }: ColumnMapperProps) {
  // Initialize mapping: use initialMapping if provided, or auto-detect
  const [mapping, setMapping] = useState<ColumnMappingState>(() => {
    if (initialMapping && Object.keys(initialMapping).length > 0) {
      return initialMapping;
    }
    return autoDetectMapping(headers);
  });

  // Save mapping options
  const [saveMapping, setSaveMapping] = useState(false);
  const [mappingName, setMappingName] = useState('');

  // Compute validation state
  const validation = useMemo((): MappingValidation => {
    const mappedFields = Object.keys(mapping).filter(
      (field): field is VehicleField => mapping[field as VehicleField] !== null && mapping[field as VehicleField] !== undefined
    );

    const missingRequired = REQUIRED_VEHICLE_FIELDS.filter(
      (field) => !mappedFields.includes(field)
    );

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      mappedFields,
    };
  }, [mapping]);

  // Notify parent of changes
  useEffect(() => {
    onChange(mapping, validation);
  }, [mapping, validation, onChange]);

  // Get already-used Excel headers (to disable in other dropdowns)
  const usedHeaders = useMemo(() => {
    return new Set(Object.values(mapping).filter((h): h is string => h !== null && h !== undefined));
  }, [mapping]);

  // Handle mapping change for a specific field
  const handleMappingChange = (field: VehicleField, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value === '__none__' ? null : value,
    }));
  };

  // Separate required and optional fields
  const requiredFields = VEHICLE_FIELDS.filter((f) => REQUIRED_VEHICLE_FIELDS.includes(f));
  const optionalFields = VEHICLE_FIELDS.filter((f) => !REQUIRED_VEHICLE_FIELDS.includes(f));

  return (
    <div className="space-y-6">
      {/* Mapping Summary */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Column Mapping</h3>
          <p className="text-xs text-muted-foreground">
            Select which Excel column maps to each vehicle field
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={validation.isValid ? 'default' : 'secondary'}>
            {validation.mappedFields.length} of {REQUIRED_VEHICLE_FIELDS.length} required mapped
          </Badge>
        </div>
      </div>

      {/* Missing Required Fields Warning */}
      {!validation.isValid && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/20 dark:border-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Required fields missing
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Please map: {validation.missingRequired.map((f) => VEHICLE_FIELD_LABELS[f]).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Required Fields Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Required Fields</h4>
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr,1fr,auto] gap-4 bg-muted/50 px-4 py-2 text-sm font-medium border-b">
            <div>Vehicle Field</div>
            <div>Excel Column</div>
            <div className="w-8 text-center">Status</div>
          </div>

          <div className="divide-y">
            {requiredFields.map((field) => (
              <FieldMappingRow
                key={field}
                field={field}
                isRequired={true}
                headers={headers}
                usedHeaders={usedHeaders}
                currentValue={mapping[field] ?? null}
                onChange={handleMappingChange}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Optional Fields Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Optional Fields</h4>
        <div className="border rounded-lg overflow-hidden">
          <div className="divide-y">
            {optionalFields.map((field) => (
              <FieldMappingRow
                key={field}
                field={field}
                isRequired={false}
                headers={headers}
                usedHeaders={usedHeaders}
                currentValue={mapping[field] ?? null}
                onChange={handleMappingChange}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Save Mapping Option (UI only for now - functionality in P2) */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-dashed">
        <div className="flex items-center gap-2">
          <Checkbox
            id="save-mapping"
            checked={saveMapping}
            onCheckedChange={(checked) => setSaveMapping(checked === true)}
          />
          <Label htmlFor="save-mapping" className="text-sm cursor-pointer">
            Save this mapping for future uploads
          </Label>
        </div>

        {saveMapping && (
          <div className="flex items-center gap-3 pl-6">
            <Label htmlFor="mapping-name" className="text-sm whitespace-nowrap">
              Mapping name:
            </Label>
            <Input
              id="mapping-name"
              value={mappingName}
              onChange={(e) => setMappingName(e.target.value)}
              placeholder="e.g., Main inventory export"
              className="max-w-xs"
            />
          </div>
        )}

        {saveMapping && (
          <p className="text-xs text-muted-foreground pl-6">
            Save functionality coming soon - mappings will be saved to your account.
          </p>
        )}
      </div>
    </div>
  );
}

interface FieldMappingRowProps {
  field: VehicleField;
  isRequired: boolean;
  headers: string[];
  usedHeaders: Set<string>;
  currentValue: string | null;
  onChange: (field: VehicleField, value: string) => void;
}

function FieldMappingRow({
  field,
  isRequired,
  headers,
  usedHeaders,
  currentValue,
  onChange,
}: FieldMappingRowProps) {
  const isMapped = currentValue !== null;

  return (
    <div className="grid grid-cols-[1fr,1fr,auto] gap-4 items-center px-4 py-3">
      {/* System Field Name */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {VEHICLE_FIELD_LABELS[field]}
        </span>
        {isRequired && (
          <span className="text-destructive">*</span>
        )}
      </div>

      {/* Excel Column Dropdown */}
      <div>
        <Select
          value={currentValue ?? '__none__'}
          onValueChange={(value) => onChange(field, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select column..." />
          </SelectTrigger>
          <SelectContent>
            {/* None/Skip Option */}
            <SelectItem value="__none__">
              <span className="text-muted-foreground">-- Not mapped --</span>
            </SelectItem>

            {/* Excel Headers */}
            {headers.map((header) => {
              const isUsed = usedHeaders.has(header) && currentValue !== header;
              return (
                <SelectItem
                  key={header}
                  value={header}
                  disabled={isUsed}
                >
                  <span className={isUsed ? 'opacity-50' : ''}>
                    {header}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Status Icon */}
      <div className="w-8 flex justify-center">
        {isMapped ? (
          <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
          </div>
        ) : isRequired ? (
          <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-3 w-3 text-red-600 dark:text-red-400" />
          </div>
        ) : (
          <div className="p-1 rounded-full bg-muted">
            <X className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

// Export validation helper for external use
export function validateMapping(mapping: ColumnMappingState): MappingValidation {
  const mappedFields = Object.keys(mapping).filter(
    (field): field is VehicleField => mapping[field as VehicleField] !== null && mapping[field as VehicleField] !== undefined
  );

  const missingRequired = REQUIRED_VEHICLE_FIELDS.filter(
    (field) => !mappedFields.includes(field)
  );

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    mappedFields,
  };
}
