'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Handshake,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageSquare,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface NegotiationListItem {
  id: string;
  buyerId: string;
  status: 'DRAFT' | 'BUYER_FINALIZED' | 'SELLER_APPROVED' | 'CANCELLED';
  incoterm: string;
  depositPercent: number;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    email: string;
  };
  seller: {
    id: string;
    companyName: string;
  };
  itemCount: number;
  systemTotal: number;
  negotiatedTotal: number;
  savings: number;
  lastMessage: {
    content: string;
    senderRole: string;
    createdAt: string;
  } | null;
}

const statusConfig = {
  DRAFT: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  BUYER_FINALIZED: {
    label: 'Awaiting Approval',
    variant: 'default' as const,
    icon: Handshake,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  SELLER_APPROVED: {
    label: 'Approved',
    variant: 'default' as const,
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  CANCELLED: {
    label: 'Cancelled',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

export default function SellerNegotiationsPage() {
  const [negotiations, setNegotiations] = useState<NegotiationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const fetchNegotiations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ role: 'seller' });
      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }

      const response = await fetch(`/api/negotiations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNegotiations(data);
      }
    } catch (error) {
      console.error('Error fetching negotiations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchNegotiations();
  }, [fetchNegotiations]);

  const filteredNegotiations = negotiations;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Count by status
  const pendingCount = negotiations.filter((n) => n.status === 'DRAFT').length;
  const awaitingCount = negotiations.filter((n) => n.status === 'BUYER_FINALIZED').length;
  const approvedCount = negotiations.filter((n) => n.status === 'SELLER_APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Negotiations</h1>
          <p className="text-muted-foreground">
            Review and respond to buyer negotiation requests
          </p>
        </div>
        <Button variant="outline" onClick={fetchNegotiations} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Your Approval</p>
                <p className="text-2xl font-bold">{awaitingCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Handshake className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Deals</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList>
          <TabsTrigger value="all">All ({negotiations.length})</TabsTrigger>
          <TabsTrigger value="BUYER_FINALIZED">
            Awaiting Approval ({awaitingCount})
          </TabsTrigger>
          <TabsTrigger value="DRAFT">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="SELLER_APPROVED">Approved ({approvedCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Negotiations List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNegotiations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No negotiations yet</h3>
            <p className="text-muted-foreground text-sm">
              When buyers start negotiating, their requests will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNegotiations.map((negotiation) => {
            const config = statusConfig[negotiation.status];
            const StatusIcon = config.icon;

            return (
              <Link key={negotiation.id} href={`/seller/negotiations/${negotiation.id}`}>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Buyer info */}
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{negotiation.buyer.email}</h3>
                          <Badge className={config.bgColor + ' ' + config.color + ' border-0'}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{negotiation.itemCount} vehicle{negotiation.itemCount !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{negotiation.incoterm}</span>
                          <span>•</span>
                          <span>{negotiation.depositPercent}% deposit</span>
                        </div>
                        {negotiation.lastMessage && (
                          <div className="flex items-start gap-2 mt-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <p className="text-muted-foreground line-clamp-1">
                              <span className="font-medium">
                                {negotiation.lastMessage.senderRole === 'BUYER' ? 'Buyer' : 'You'}:
                              </span>{' '}
                              {negotiation.lastMessage.content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Pricing */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-muted-foreground">Offered Price</div>
                      <div className="text-xl font-bold">
                        {formatPrice(negotiation.negotiatedTotal)}
                      </div>
                      {negotiation.savings > 0 && (
                        <div className="text-sm text-green-600">
                          -{formatPrice(negotiation.savings)} from list
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        {formatDate(negotiation.updatedAt)} at {formatTime(negotiation.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Action hint for finalized negotiations */}
                  {negotiation.status === 'BUYER_FINALIZED' && (
                    <div className="mt-4 pt-3 border-t">
                      <Button className="w-full" variant="default">
                        Review & Approve Terms
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
