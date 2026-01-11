'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { NegotiationItem, NegotiationMessage } from '@/types';

interface DealData {
  id: string;
  status: string;
  incoterm: string;
  depositPercent: number;
  createdAt: string;
  updatedAt: string;
  items: NegotiationItem[];
  messages: NegotiationMessage[];
  systemTotal: number;
  negotiatedTotal: number;
  tokenDueNow: number;
  finalBalance: number;
  seller: {
    id: string;
    companyName: string;
    city?: string;
    country?: string;
  };
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<DealData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await fetch(`/api/negotiations/${dealId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Deal not found');
          }
          throw new Error('Failed to fetch deal');
        }
        const data = await response.json();
        
        // Verify this is an approved deal
        if (data.status !== 'SELLER_APPROVED') {
          router.push(`/buyer/negotiate/${data.seller.id}`);
          return;
        }
        
        setDeal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (dealId) {
      fetchDeal();
    }
  }, [dealId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Deal not found'}</p>
          <Link href="/buyer/deals">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const savings = deal.systemTotal - deal.negotiatedTotal;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/buyer/deals"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  Deal with {deal.seller.companyName}
                </h1>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Approved on {formatDate(deal.updatedAt)} • {deal.items.length} vehicle{deal.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Vehicles */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="text-primary">$</span>
            <span>Final Deal Breakdown</span>
          </div>

          {/* Vehicle Items */}
          <div className="space-y-4">
            {deal.items.map((item) => {
              const vehicle = item.vehicle;
              const primaryImage = vehicle?.images?.[0]?.url;

              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Vehicle Image */}
                      <div className="w-20 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={`${vehicle?.make} ${vehicle?.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🚗
                          </div>
                        )}
                      </div>

                      {/* Vehicle Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">
                          {vehicle?.make} {vehicle?.model}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {vehicle?.year} • {vehicle?.color}
                        </p>
                      </div>

                      {/* Pricing */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Final Price</p>
                        <p className="font-bold text-lg">
                          {formatPrice(Number(item.offerPrice))}
                        </p>
                        {Number(item.systemPrice) !== Number(item.offerPrice) && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatPrice(Number(item.systemPrice))}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Terms Display */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Incoterm
              </p>
              <Badge variant="secondary" className="text-sm">
                {deal.incoterm}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Deposit
              </p>
              <Badge variant="secondary" className="text-sm">
                {deal.depositPercent}%
              </Badge>
            </div>
          </div>

          {/* Summary Box */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">
                    Original Value
                  </p>
                  <p className="text-xl font-bold opacity-90 line-through">
                    {formatPrice(deal.systemTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-emerald-300">
                    Final Deal
                  </p>
                  <p className="text-3xl font-bold">
                    {formatPrice(deal.negotiatedTotal)}
                  </p>
                </div>
              </div>

              {savings > 0 && (
                <p className="text-center text-emerald-300 text-sm mb-4">
                  You saved {formatPrice(savings)} on this deal!
                </p>
              )}

              <div className="border-t border-primary-foreground/20 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">
                    Token Due Now
                  </p>
                  <p className="text-xl font-bold">
                    {formatPrice(deal.tokenDueNow)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider opacity-80">
                    Final Balance
                  </p>
                  <p className="text-xl font-bold">
                    {formatPrice(deal.finalBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Button */}
          <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700">
            <CreditCard className="h-5 w-5 mr-2" />
            Proceed to Checkout
          </Button>
        </div>

        {/* Right Column - Message History */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <MessageCircle className="h-4 w-4" />
            <span>Negotiation History</span>
          </div>

          <Card className="h-[600px] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4">
              {deal.messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No messages in this negotiation.
                </div>
              ) : (
                <div className="space-y-4">
                  {deal.messages.map((message) => {
                    const isBuyer = message.senderRole === 'BUYER';
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isBuyer ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            isBuyer
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isBuyer ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
