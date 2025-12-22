import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BuyerBrowseClient } from '@/components/buyer/buyer-browse-client';

export default function BuyerBrowsePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Vehicles</h1>
        <p className="text-muted-foreground">
          View grouped listings for bulk purchase or browse individual vehicles
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Grouping selector skeleton */}
            <Card className="border-dashed">
              <CardContent className="py-4">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="flex gap-4">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="h-5 bg-muted rounded w-20" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listings skeleton */}
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4 animate-pulse">
                      <div className="w-24 h-24 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        }
      >
        <BuyerBrowseClient />
      </Suspense>
    </div>
  );
}
