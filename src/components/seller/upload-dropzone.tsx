'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseExcelFile, formatFileSize, ParsedExcel, ExcelParseError } from '@/lib/excel-parser';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  onFileParsed: (data: ParsedExcel) => void;
  onClear: () => void;
  parsedData: ParsedExcel | null;
  isLoading?: boolean;
}

export function UploadDropzone({ 
  onFileParsed, 
  onClear, 
  parsedData,
  isLoading = false 
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsParsing(true);
    
    try {
      const data = await parseExcelFile(file);
      onFileParsed(data);
    } catch (err) {
      if (err instanceof ExcelParseError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsParsing(false);
    }
  }, [onFileParsed]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleClear = () => {
    setError(null);
    onClear();
  };

  // Show file info if parsed
  if (parsedData && !error) {
    return (
      <div className="border-2 border-dashed border-green-500 bg-green-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">{parsedData.fileName}</p>
              <p className="text-sm text-green-700">
                {formatFileSize(parsedData.fileSize)} • {parsedData.totalRows} rows • {parsedData.headers.length} columns
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleClear}
            disabled={isLoading}
            className="text-green-700 hover:text-green-900 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          isParsing && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'p-3 rounded-full',
            isDragging ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Upload className={cn(
              'h-8 w-8',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          
          {isParsing ? (
            <div className="space-y-1">
              <p className="text-sm font-medium">Parsing file...</p>
              <p className="text-xs text-muted-foreground">Please wait</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragging ? 'Drop your file here' : 'Drop Excel or CSV file here'}
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Accepts: .xlsx, .xls, .csv (max 10MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

