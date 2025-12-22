'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  VEHICLE_FIELD_DESCRIPTIONS,
  REQUIRED_VEHICLE_FIELDS,
  ColumnMappingState,
  MappingValidation,
  ImportDefaults,
  CURRENCY_OPTIONS,
  INCOTERM_OPTIONS,
  Currency,
  Incoterm,
} from '@/types/upload';
import { autoDetectMapping } from '@/lib/column-auto-detect';

// Fields that are conditionally required when price is mapped
const PRICING_RELATED_FIELDS: VehicleField[] = ['price', 'currency', 'incoterm'];

// Fields to show in the "Pricing" section
const PRICING_SECTION_FIELDS: VehicleField[] = ['price', 'currency', 'incoterm', 'inspectionReportLink'];

interface ColumnMapperProps {
  headers: string[];
  initialMapping?: ColumnMappingState;
  initialDefaults?: ImportDefaults;
  onChange: (mapping: ColumnMappingState, validation: MappingValidation, defaults: ImportDefaults) => void;
}

export function ColumnMapper({ headers, initialMapping, initialDefaults, onChange }: ColumnMapperProps) {
  // Initialize mapping: use initialMapping if provided, or auto-detect
  const [mapping, setMapping] = useState<ColumnMappingState>(() => {
    if (initialMapping && Object.keys(initialMapping).length > 0) {
      return initialMapping;
    }
    return autoDetectMapping(headers);
  });

  // Import defaults (currency/incoterm when not mapped from Excel)
  const [defaults, setDefaults] = useState<ImportDefaults>(initialDefaults ?? {});

  // Save mapping options
  const [saveMapping, setSaveMapping] = useState(false);
  const [mappingName, setMappingName] = useState('');

  // Check if price column is mapped
  const isPriceMapped = useMemo(() => {
    return mapping.price !== null && mapping.price !== undefined;
  }, [mapping.price]);

  // Check if currency/incoterm are mapped from Excel
  const isCurrencyMapped = useMemo(() => {
    return mapping.currency !== null && mapping.currency !== undefined;
  }, [mapping.currency]);

  const isIncotermMapped = useMemo(() => {
    return mapping.incoterm !== null && mapping.incoterm !== undefined;
  }, [mapping.incoterm]);

  // Compute validation state
  const validation = useMemo((): MappingValidation => {
    const mappedFields = Object.keys(mapping).filter(
      (field): field is VehicleField => mapping[field as VehicleField] !== null && mapping[field as VehicleField] !== undefined
    );

    const missingRequired = REQUIRED_VEHICLE_FIELDS.filter(
      (field) => !mappedFields.includes(field)
    );

    // Additional validation: if price is mapped, currency and incoterm need to be resolved
    let isValid = missingRequired.length === 0;
    
    if (isPriceMapped) {
      // Currency must be mapped OR have a default selected
      const currencyResolved = isCurrencyMapped || defaults.currency !== undefined;
      // Incoterm must be mapped OR have a default selected
      const incotermResolved = isIncotermMapped || defaults.incoterm !== undefined;
      
      if (!currencyResolved || !incotermResolved) {
        isValid = false;
      }
    }

    return {
      isValid,
      missingRequired,
      mappedFields,
    };
  }, [mapping, isPriceMapped, isCurrencyMapped, isIncotermMapped, defaults]);

  // Notify parent of changes
  useEffect(() => {
    onChange(mapping, validation, defaults);
  }, [mapping, validation, defaults, onChange]);

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

  // Handle default value changes
  const handleDefaultCurrencyChange = (value: Currency) => {
    setDefaults((prev) => ({ ...prev, currency: value }));
  };

  const handleDefaultIncotermChange = (value: Incoterm) => {
    setDefaults((prev) => ({ ...prev, incoterm: value }));
  };

  // Separate required, pricing, and other optional fields
  const requiredFields = VEHICLE_FIELDS.filter((f) => REQUIRED_VEHICLE_FIELDS.includes(f));
  const pricingFields = PRICING_SECTION_FIELDS;
  const otherOptionalFields = VEHICLE_FIELDS.filter(
    (f) => !REQUIRED_VEHICLE_FIELDS.includes(f) && !PRICING_SECTION_FIELDS.includes(f)
  );

  // Check if currency/incoterm needs default selection
  const needsCurrencyDefault = isPriceMapped && !isCurrencyMapped;
  const needsIncotermDefault = isPriceMapped && !isIncotermMapped;

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
      {validation.missingRequired.length > 0 && (
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

      {/* Pricing Requirements Warning */}
      {isPriceMapped && (needsCurrencyDefault && !defaults.currency || needsIncotermDefault && !defaults.incoterm) && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/20 dark:border-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Pricing fields required
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              When Price is mapped, you must specify Currency and Incoterm (either from Excel or select a default below)
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

      {/* Pricing Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Pricing & Trade Terms</h4>
        <div className="border rounded-lg overflow-hidden">
          <div className="divide-y">
            {/* Price Field */}
            <FieldMappingRow
              field="price"
              isRequired={false}
              headers={headers}
              usedHeaders={usedHeaders}
              currentValue={mapping.price ?? null}
              onChange={handleMappingChange}
              description={VEHICLE_FIELD_DESCRIPTIONS.price}
            />

            {/* RFQ Notice when price is not mapped */}
            {!isPriceMapped && (
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Vehicles without price will display as <strong>&quot;RFQ&quot;</strong> (Request for Quote)
                  </p>
                </div>
              </div>
            )}

            {/* Incoterm Field - only show when price is mapped */}
            {isPriceMapped && (
              <div className="grid grid-cols-[1fr,1fr,auto] gap-4 items-start px-4 py-3">
                {/* Field Label */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {VEHICLE_FIELD_LABELS.incoterm}
                    </span>
                    <span className="text-destructive">*</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {VEHICLE_FIELD_DESCRIPTIONS.incoterm}
                  </span>
                </div>

                {/* Excel Column Dropdown */}
                <div className="space-y-2">
                  <Select
                    value={mapping.incoterm ?? '__none__'}
                    onValueChange={(value) => handleMappingChange('incoterm', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Select Excel Column --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">-- Select Excel Column --</span>
                      </SelectItem>
                      {headers.map((header) => {
                        const isUsed = usedHeaders.has(header) && mapping.incoterm !== header;
                        return (
                          <SelectItem key={header} value={header} disabled={isUsed}>
                            <span className={isUsed ? 'opacity-50' : ''}>{header}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Default Selection Buttons */}
                  {needsIncotermDefault && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">or select default:</span>
                      <div className="flex gap-1">
                        {INCOTERM_OPTIONS.map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={defaults.incoterm === option ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => handleDefaultIncotermChange(option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Icon */}
                <div className="w-8 flex justify-center pt-2">
                  {isIncotermMapped || defaults.incoterm ? (
                    <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
                      <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Currency Field - only show when price is mapped */}
            {isPriceMapped && (
              <div className="grid grid-cols-[1fr,1fr,auto] gap-4 items-start px-4 py-3">
                {/* Field Label */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {VEHICLE_FIELD_LABELS.currency}
                    </span>
                    <span className="text-destructive">*</span>
                  </div>
                </div>

                {/* Excel Column Dropdown */}
                <div className="space-y-2">
                  <Select
                    value={mapping.currency ?? '__none__'}
                    onValueChange={(value) => handleMappingChange('currency', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Select Excel Column --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        <span className="text-muted-foreground">-- Select Excel Column --</span>
                      </SelectItem>
                      {headers.map((header) => {
                        const isUsed = usedHeaders.has(header) && mapping.currency !== header;
                        return (
                          <SelectItem key={header} value={header} disabled={isUsed}>
                            <span className={isUsed ? 'opacity-50' : ''}>{header}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Default Selection Dropdown */}
                  {needsCurrencyDefault && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">or select default:</span>
                      <Select
                        value={defaults.currency ?? '__none__'}
                        onValueChange={(value) => {
                          if (value !== '__none__') {
                            handleDefaultCurrencyChange(value as Currency);
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Status Icon */}
                <div className="w-8 flex justify-center pt-2">
                  {isCurrencyMapped || defaults.currency ? (
                    <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/30">
                      <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inspection Report Link */}
            <FieldMappingRow
              field="inspectionReportLink"
              isRequired={false}
              headers={headers}
              usedHeaders={usedHeaders}
              currentValue={mapping.inspectionReportLink ?? null}
              onChange={handleMappingChange}
              description={VEHICLE_FIELD_DESCRIPTIONS.inspectionReportLink}
            />
          </div>
        </div>
      </div>

      {/* Other Optional Fields Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Other Optional Fields</h4>
        <div className="border rounded-lg overflow-hidden">
          <div className="divide-y">
            {otherOptionalFields.map((field) => (
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
  description?: string;
}

function FieldMappingRow({
  field,
  isRequired,
  headers,
  usedHeaders,
  currentValue,
  onChange,
  description,
}: FieldMappingRowProps) {
  const isMapped = currentValue !== null;

  return (
    <div className="grid grid-cols-[1fr,1fr,auto] gap-4 items-center px-4 py-3">
      {/* System Field Name */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {VEHICLE_FIELD_LABELS[field]}
          </span>
          {isRequired && (
            <span className="text-destructive">*</span>
          )}
        </div>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>

      {/* Excel Column Dropdown */}
      <div>
        <Select
          value={currentValue ?? '__none__'}
          onValueChange={(value) => onChange(field, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Select Excel Column --" />
          </SelectTrigger>
          <SelectContent>
            {/* None/Skip Option */}
            <SelectItem value="__none__">
              <span className="text-muted-foreground">-- Select Excel Column --</span>
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
export function validateMapping(mapping: ColumnMappingState, defaults?: ImportDefaults): MappingValidation {
  const mappedFields = Object.keys(mapping).filter(
    (field): field is VehicleField => mapping[field as VehicleField] !== null && mapping[field as VehicleField] !== undefined
  );

  const missingRequired = REQUIRED_VEHICLE_FIELDS.filter(
    (field) => !mappedFields.includes(field)
  );

  const isPriceMapped = mapping.price !== null && mapping.price !== undefined;
  const isCurrencyMapped = mapping.currency !== null && mapping.currency !== undefined;
  const isIncotermMapped = mapping.incoterm !== null && mapping.incoterm !== undefined;

  let isValid = missingRequired.length === 0;

  if (isPriceMapped) {
    const currencyResolved = isCurrencyMapped || defaults?.currency !== undefined;
    const incotermResolved = isIncotermMapped || defaults?.incoterm !== undefined;
    
    if (!currencyResolved || !incotermResolved) {
      isValid = false;
    }
  }

  return {
    isValid,
    missingRequired,
    mappedFields,
  };
}
