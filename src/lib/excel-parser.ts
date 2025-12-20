import * as XLSX from 'xlsx';

export interface ParsedExcel {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  fileName: string;
  fileSize: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
];
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

export class ExcelParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelParseError';
  }
}

function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new ExcelParseError(
      `File size (${formatFileSize(file.size)}) exceeds maximum allowed size of 10MB`
    );
  }

  // Check file extension
  const extension = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new ExcelParseError(
      `Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file`
    );
  }

  // Check MIME type (with fallback for CSV which may have various types)
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.csv')) {
    throw new ExcelParseError(
      `Invalid file type. Please upload an Excel (.xlsx, .xls) or CSV file`
    );
  }
}

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function parseExcelFile(file: File): Promise<ParsedExcel> {
  return new Promise((resolve, reject) => {
    try {
      validateFile(file);
    } catch (error) {
      reject(error);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new ExcelParseError('The file appears to be empty or has no sheets');
        }

        const firstSheet = workbook.Sheets[firstSheetName];
        
        // Parse as array of arrays to get headers and rows separately
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { 
          header: 1,
          defval: '' // Use empty string for empty cells
        });

        if (jsonData.length === 0) {
          throw new ExcelParseError('The file appears to be empty');
        }

        // First row is headers
        const rawHeaders = jsonData[0] as unknown[];
        const headers = rawHeaders.map((h, index) => 
          h ? String(h).trim() : `Column ${index + 1}`
        );

        // Rest are data rows
        const dataRows = jsonData.slice(1);
        
        // Convert to array of objects
        const rows = dataRows
          .filter((row) => {
            // Filter out completely empty rows
            const rowArray = row as unknown[];
            return rowArray.some((cell) => cell !== '' && cell !== null && cell !== undefined);
          })
          .map((row) => {
            const rowArray = row as unknown[];
            const obj: Record<string, unknown> = {};
            headers.forEach((header, i) => {
              obj[header] = rowArray[i] ?? '';
            });
            return obj;
          });

        resolve({
          headers,
          rows,
          totalRows: rows.length,
          fileName: file.name,
          fileSize: file.size,
        });
      } catch (error) {
        if (error instanceof ExcelParseError) {
          reject(error);
        } else {
          reject(new ExcelParseError('Failed to parse file. Please ensure it is a valid Excel or CSV file.'));
        }
      }
    };

    reader.onerror = () => {
      reject(new ExcelParseError('Failed to read file. Please try again.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

