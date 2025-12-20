'use client';

import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImportProgressProps {
  current: number;
  total: number;
  message?: string;
}

export function ImportProgress({ current, total, message }: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="py-8 space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">
            {message || 'Importing vehicles...'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Please don&apos;t close this page
          </p>
        </div>
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <Progress value={percentage} className="h-3" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{percentage}% complete</span>
          <span>{current} of {total} vehicles</span>
        </div>
      </div>
    </div>
  );
}

