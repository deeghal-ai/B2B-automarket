'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, AlertTriangle, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportSummaryProps {
  imported: number;
  failed: number;
  errors?: Array<{ index: number; message: string }>;
  onUploadAnother: () => void;
}

export function ImportSummary({ 
  imported, 
  failed, 
  errors = [],
  onUploadAnother 
}: ImportSummaryProps) {
  const isSuccess = imported > 0 && failed === 0;
  const isPartialSuccess = imported > 0 && failed > 0;
  const isFailure = imported === 0;

  return (
    <div className="py-8 space-y-6">
      {/* Status Icon and Message */}
      <div className="flex flex-col items-center gap-4">
        {isSuccess && (
          <>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">
                Import Complete!
              </h3>
              <p className="text-muted-foreground mt-1">
                Successfully imported {imported} vehicle{imported !== 1 ? 's' : ''} as drafts.
              </p>
            </div>
          </>
        )}

        {isPartialSuccess && (
          <>
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-amber-700 dark:text-amber-300">
                Partial Import
              </h3>
              <p className="text-muted-foreground mt-1">
                Imported {imported} vehicle{imported !== 1 ? 's' : ''}, 
                {' '}{failed} skipped.
              </p>
            </div>
          </>
        )}

        {isFailure && (
          <>
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-red-700 dark:text-red-300">
                Import Failed
              </h3>
              <p className="text-muted-foreground mt-1">
                No vehicles were imported. Please check your data and try again.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="max-w-md mx-auto">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium">Details:</p>
            {errors.map((error, idx) => (
              <p key={idx} className="text-sm text-muted-foreground">
                {error.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="flex justify-center gap-8 py-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {imported}
          </div>
          <div className="text-sm text-muted-foreground">Imported</div>
        </div>
        {failed > 0 && (
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {failed}
            </div>
            <div className="text-sm text-muted-foreground">Skipped</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
        <Button variant="outline" onClick={onUploadAnother} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Another File
        </Button>
        <Link href="/seller/inventory">
          <Button className="gap-2 w-full sm:w-auto">
            Go to Inventory
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

