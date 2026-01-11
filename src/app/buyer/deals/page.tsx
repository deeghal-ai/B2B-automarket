'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Car,
  Loader2,
  FileText,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ApprovedDeal {
  id: string;
  sellerId: string;
  status: string;
  incoterm: string;
  depositPercent: number;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    companyName: string;
    city?: string;
    country?: string;
  };
  itemCount: number;
  systemTotal: number;
  negotiatedTotal: number;
  savings: number;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<ApprovedDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/negotiations?role=buyer&status=SELLER_APPROVED');
        if (!response.ok) {
          throw new Error('Failed to fetch deals');
        }
        const data = await response.json();
        setDeals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href="/buyer">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/buyer"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Browse
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Approved Deals</h1>
            <p className="text-muted-foreground">
              {deals.length} deal{deals.length !== 1 ? 's' : ''} ready for checkout
            </p>
          </div>
        </div>
      </div>

      {/* Deals List */}
      {deals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Approved Deals Yet</h3>
            <p className="text-muted-foreground mb-6">
              When sellers approve your negotiations, they&apos;ll appear here.
            </p>
            <Link href="/buyer">
              <Button>Browse Vehicles</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <Link key={deal.id} href={`/buyer/deals/${deal.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Left side - Seller info */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{deal.seller.companyName}</h3>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        {deal.seller.city && deal.seller.country && (
                          <p className="text-sm text-muted-foreground">
                            {deal.seller.city}, {deal.seller.country}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            {deal.itemCount} vehicle{deal.itemCount !== 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(deal.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side - Pricing */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Deal Total</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(deal.negotiatedTotal)}
                      </p>
                      {deal.savings > 0 && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                          You saved {formatPrice(deal.savings)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Badge variant="outline">{deal.incoterm}</Badge>
                        <Badge variant="outline">{deal.depositPercent}% deposit</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
