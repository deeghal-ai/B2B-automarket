'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FileSpreadsheet, Columns3, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadDropzone } from '@/components/seller/upload-dropzone';
import { DataPreview } from '@/components/seller/data-preview';
import { ColumnMapper } from '@/components/seller/column-mapper';
import { ValidationErrors } from '@/components/seller/validation-errors';
import { ImportProgress } from '@/components/seller/import-progress';
import { ImportSummary } from '@/components/seller/import-summary';
import { ParsedExcel } from '@/lib/excel-parser';
import { 
  ColumnMappingState, 
  MappingValidation, 
  TransformedVehicle, 
  ValidationError,
  ImportState,
  ValidateResponse,
  ImportResponse,
} from '@/types/upload';

type UploadStep = 'upload' | 'mapping' | 'import';

export default function SellerUploadPage() {
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [parsedData, setParsedData] = useState<ParsedExcel | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingState>({});
  const [mappingValidation, setMappingValidation] = useState<MappingValidation>({
    isValid: false,
    missingRequired: [],
    mappedFields: [],
  });

  // Validation & Import state
  const [importState, setImportState] = useState<ImportState>('idle');
  const [validRows, setValidRows] = useState<TransformedVehicle[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [invalidRowCount, setInvalidRowCount] = useState(0);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: Array<{ index: number; message: string }> } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileParsed = (data: ParsedExcel) => {
    setParsedData(data);
    // Reset all state when new file is uploaded
    setColumnMapping({});
    setImportState('idle');
    setValidRows([]);
    setValidationErrors([]);
    setInvalidRowCount(0);
    setImportResult(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setParsedData(null);
    setColumnMapping({});
    setImportState('idle');
    setValidRows([]);
    setValidationErrors([]);
    setInvalidRowCount(0);
    setImportResult(null);
    setErrorMessage(null);
  };

  const handleContinueToMapping = () => {
    if (parsedData) {
      setCurrentStep('mapping');
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
  };

  const handleMappingChange = useCallback(
    (mapping: ColumnMappingState, validation: MappingValidation) => {
      setColumnMapping(mapping);
      setMappingValidation(validation);
    },
    []
  );

  const handleContinueToImport = async () => {
    if (!mappingValidation.isValid || !parsedData) return;

    setCurrentStep('import');
    setImportState('validating');
    setErrorMessage(null);

    try {
      // Call validation API
      const response = await fetch('/api/upload/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedData.rows,
          mapping: columnMapping,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Validation failed');
      }

      const result: ValidateResponse = await response.json();
      
      setValidRows(result.validRows);
      setValidationErrors(result.errors);
      setInvalidRowCount(result.invalidRowCount);
      setImportState('validated');
    } catch (error) {
      console.error('Validation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Validation failed');
      setImportState('error');
    }
  };

  const handleBackToMapping = () => {
    setCurrentStep('mapping');
    setImportState('idle');
    setValidRows([]);
    setValidationErrors([]);
    setInvalidRowCount(0);
    setErrorMessage(null);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;

    setImportState('importing');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/upload/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicles: validRows,
        }),
      });

      const result: ImportResponse = await response.json();

      if (!response.ok && !result.success) {
        throw new Error(result.errors?.[0]?.message || 'Import failed');
      }

      setImportResult({
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
      });
      setImportState('complete');
    } catch (error) {
      console.error('Import error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Import failed');
      setImportState('error');
    }
  };

  const handleUploadAnother = () => {
    setCurrentStep('upload');
    setParsedData(null);
    setColumnMapping({});
    setMappingValidation({
      isValid: false,
      missingRequired: [],
      mappedFields: [],
    });
    setImportState('idle');
    setValidRows([]);
    setValidationErrors([]);
    setInvalidRowCount(0);
    setImportResult(null);
    setErrorMessage(null);
  };

  const isStepComplete = (step: UploadStep): boolean => {
    if (step === 'upload') return currentStep !== 'upload';
    if (step === 'mapping') return currentStep === 'import';
    if (step === 'import') return importState === 'complete';
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/seller">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload Inventory</h1>
          <p className="text-muted-foreground">
            Import vehicles from your Excel or CSV file
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        <StepIndicator 
          step={1} 
          label="Upload File" 
          isActive={currentStep === 'upload'} 
          isComplete={isStepComplete('upload')}
        />
        <div className="h-px w-8 bg-muted-foreground/25" />
        <StepIndicator 
          step={2} 
          label="Map Columns" 
          isActive={currentStep === 'mapping'} 
          isComplete={isStepComplete('mapping')}
        />
        <div className="h-px w-8 bg-muted-foreground/25" />
        <StepIndicator 
          step={3} 
          label="Import" 
          isActive={currentStep === 'import'} 
          isComplete={isStepComplete('import')}
        />
      </div>

      {/* Step 1: Upload */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Step 1: Upload Your File
            </CardTitle>
            <CardDescription>
              Upload an Excel or CSV file containing your vehicle inventory.
              We&apos;ll help you map your columns to our system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <UploadDropzone
              onFileParsed={handleFileParsed}
              onClear={handleClear}
              parsedData={parsedData}
            />

            {parsedData && (
              <>
                <DataPreview data={parsedData} />

                <div className="flex justify-end">
                  <Button onClick={handleContinueToMapping} className="gap-2">
                    Continue to Column Mapping
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {currentStep === 'mapping' && parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Columns3 className="h-5 w-5" />
              Step 2: Map Your Columns
            </CardTitle>
            <CardDescription>
              Match your Excel columns to our vehicle fields. Required fields are marked with *.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File info reminder */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <span className="font-medium">{parsedData.fileName}</span>
                <span className="text-muted-foreground ml-2">
                  ({parsedData.totalRows} rows, {parsedData.headers.length} columns)
                </span>
              </div>
            </div>

            {/* Column Mapper */}
            <ColumnMapper
              headers={parsedData.headers}
              initialMapping={columnMapping}
              onChange={handleMappingChange}
            />

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={handleBackToUpload} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleContinueToImport}
                disabled={!mappingValidation.isValid}
                className="gap-2"
              >
                Validate & Preview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Validate & Import */}
      {currentStep === 'import' && parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Step 3: Review & Import
            </CardTitle>
            <CardDescription>
              Review validation results and import vehicles to your inventory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Validating State */}
            {importState === 'validating' && (
              <div className="py-12 flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-muted-foreground">Validating your data...</p>
              </div>
            )}

            {/* Validated State - Show results */}
            {importState === 'validated' && (
              <div className="space-y-6">
                {/* Validation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {validRows.length}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          rows valid and ready
                        </p>
                      </div>
                    </div>
                  </div>

                  {invalidRowCount > 0 && (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center">
                          <span className="text-amber-700 dark:text-amber-300 font-bold">!</span>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                            {invalidRowCount}
                          </p>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            rows with errors (will be skipped)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <ValidationErrors errors={validationErrors} />
                )}

                {/* No valid rows warning */}
                {validRows.length === 0 && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-center">
                    <p className="text-red-700 dark:text-red-300 font-medium">
                      No valid rows to import
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Please fix the errors in your data and try again.
                    </p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={handleBackToMapping} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Mapping
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validRows.length === 0}
                    className="gap-2"
                  >
                    Import {validRows.length} Vehicle{validRows.length !== 1 ? 's' : ''}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Importing State */}
            {importState === 'importing' && (
              <ImportProgress 
                current={0} 
                total={validRows.length}
                message="Importing vehicles to your inventory..."
              />
            )}

            {/* Complete State */}
            {importState === 'complete' && importResult && (
              <ImportSummary
                imported={importResult.imported}
                failed={importResult.failed}
                errors={importResult.errors}
                onUploadAnother={handleUploadAnother}
              />
            )}

            {/* Error State */}
            {importState === 'error' && (
              <div className="py-8 space-y-6">
                <div className="text-center">
                  <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                    <span className="text-4xl">❌</span>
                  </div>
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                    Something went wrong
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {errorMessage || 'An unexpected error occurred'}
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={handleBackToMapping} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Mapping
                  </Button>
                  <Button onClick={handleContinueToImport} className="gap-2">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}

function StepIndicator({ step, label, isActive, isComplete }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
          ${isComplete 
            ? 'bg-primary text-primary-foreground' 
            : isActive 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }
        `}
      >
        {isComplete ? '✓' : step}
      </div>
      <span className={`
        ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}
      `}>
        {label}
      </span>
    </div>
  );
}
