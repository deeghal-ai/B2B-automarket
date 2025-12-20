'use client';

import { ParsedExcel } from '@/lib/excel-parser';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataPreviewProps {
  data: ParsedExcel;
  previewRowCount?: number;
}

export function DataPreview({ data, previewRowCount = 5 }: DataPreviewProps) {
  const previewRows = data.rows.slice(0, previewRowCount);
  const hasMoreRows = data.totalRows > previewRowCount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Preview (first {Math.min(previewRowCount, data.totalRows)} rows)
        </h3>
        <Badge variant="secondary">
          {data.totalRows} total rows
        </Badge>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {data.headers.map((header, index) => (
                  <TableHead 
                    key={index} 
                    className="whitespace-nowrap font-medium"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={data.headers.length} 
                    className="text-center text-muted-foreground py-8"
                  >
                    No data rows found
                  </TableCell>
                </TableRow>
              ) : (
                previewRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {data.headers.map((header, cellIndex) => (
                      <TableCell 
                        key={cellIndex}
                        className="whitespace-nowrap max-w-[200px] truncate"
                        title={String(row[header] ?? '')}
                      >
                        {formatCellValue(row[header])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {hasMoreRows && (
        <p className="text-xs text-muted-foreground text-center">
          ... and {data.totalRows - previewRowCount} more rows
        </p>
      )}
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    // Format numbers with commas
    return value.toLocaleString();
  }
  return String(value);
}

