'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  ArrowLeft,
  Send,
  RefreshCw,
  MessageCircle,
  Check,
  Loader2,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import type {
  NegotiationItem,
  NegotiationMessage,
  NegotiationStatus,
} from '@/types';

interface NegotiationData {
  id: string;
  status: NegotiationStatus;
  incoterm: string;
  depositPercent: number;
  items: NegotiationItem[];
  messages: NegotiationMessage[];
  userRole: 'BUYER' | 'SELLER';
  systemTotal: number;
  negotiatedTotal: number;
  seller: {
    id: string;
    companyName: string;
  };
  buyer: {
    id: string;
    email: string;
  };
}

export default function SellerNegotiationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const negotiationId = params.id as string;

  const [negotiation, setNegotiation] = useState<NegotiationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchNegotiation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/negotiations/${negotiationId}`);
      if (!response.ok) {
        throw new Error('Failed to load negotiation');
      }
      const data = await response.json();
      setNegotiation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [negotiationId]);

  useEffect(() => {
    fetchNegotiation();
  }, [fetchNegotiation]);

  // Calculate totals
  const systemTotal = negotiation?.items.reduce(
    (sum, item) => sum + Number(item.systemPrice),
    0
  ) || 0;
  const negotiatedTotal = negotiation?.items.reduce(
    (sum, item) => sum + Number(item.offerPrice),
    0
  ) || 0;
  const savings = systemTotal - negotiatedTotal;
  const depositPercent = negotiation?.depositPercent || 10;
  const tokenDueNow = negotiatedTotal * (depositPercent / 100);
  const finalBalance = negotiatedTotal - tokenDueNow;

  const isFinalized = negotiation?.status === 'BUYER_FINALIZED';
  const isApproved = negotiation?.status === 'SELLER_APPROVED';
  const buyerFinalized = isFinalized || isApproved;
  const sellerApproved = isApproved;

  const handleApprove = async () => {
    if (!negotiation) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/negotiations/${negotiation.id}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        const updated = await response.json();
        setNegotiation(updated);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!negotiation || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/negotiations/${negotiation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (response.ok) {
        const message = await response.json();
        setNegotiation((prev) =>
          prev ? { ...prev, messages: [...prev.messages, message] } : prev
        );
        setNewMessage('');
      }
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isLoading && !negotiation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Link href="/seller/negotiations">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Negotiations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const assetCount = negotiation?.items.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/seller/negotiations"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Negotiations
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Negotiation from Buyer
              </h1>
              <Badge variant="secondary">
                {assetCount} ASSET{assetCount !== 1 ? 'S' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
              <Mail className="h-4 w-4" />
              <span>{negotiation?.buyer?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Price & Terms (Read-only for seller) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="text-primary">$</span>
            <span>Buyer&apos;s Proposed Terms</span>
          </div>

          {/* Vehicle Items */}
          <div className="space-y-4">
            {negotiation?.items.map((item) => {
              const vehicle = item.vehicle;
              const primaryImage = vehicle?.images?.[0]?.url;
              const offerPrice = Number(item.offerPrice);
              const itemSavings = Number(item.systemPrice) - offerPrice;

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
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">
                              {vehicle?.make} {vehicle?.model}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {vehicle?.year} • {vehicle?.color}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Your List Price
                            </p>
                            <p className="font-medium">
                              {formatPrice(Number(item.systemPrice))}
                            </p>
                          </div>
                        </div>

                        {/* Offer Display */}
                        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                          <div>
                            <p className="text-xs text-primary uppercase tracking-wider font-medium">
                              Buyer&apos;s Offer
                            </p>
                            <p className="text-lg font-bold">{formatPrice(offerPrice)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Discount
                            </p>
                            <p
                              className={`font-medium ${
                                itemSavings >= 0 ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {itemSavings >= 0 ? '-' : '+'}${Math.abs(itemSavings).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Terms Display */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Incoterm
              </p>
              <p className="text-lg font-semibold">{negotiation?.incoterm}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Deposit
              </p>
              <p className="text-lg font-semibold">{negotiation?.depositPercent}%</p>
            </div>
          </div>

          {/* Summary Box */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs opacity-80 uppercase tracking-wider">Your Total Value</p>
                  <p className="text-lg line-through opacity-60">{formatPrice(systemTotal)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-300 uppercase tracking-wider font-medium">
                    Buyer&apos;s Offer
                  </p>
                  <p className="text-3xl font-bold">{formatPrice(negotiatedTotal)}</p>
                </div>
              </div>
              <div className="border-t border-primary-foreground/20 pt-4 flex justify-between">
                <div>
                  <p className="text-xs opacity-80 uppercase tracking-wider">Token Due Now</p>
                  <p className="text-xl font-semibold">{formatPrice(tokenDueNow)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80 uppercase tracking-wider">Final Balance</p>
                  <p className="text-xl font-semibold">{formatPrice(finalBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          {isApproved ? (
            <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" disabled>
              <Check className="h-4 w-4 mr-2" />
              Terms Approved
            </Button>
          ) : isFinalized ? (
            <Button className="w-full" size="lg" onClick={handleApprove} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve Terms
            </Button>
          ) : (
            <Button className="w-full" size="lg" variant="outline" disabled>
              Waiting for Buyer to Finalize
            </Button>
          )}
        </div>

        {/* Right Column - Chat */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span>Discussion Thread</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    buyerFinalized ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-muted-foreground">Buyer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    sellerApproved ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-muted-foreground">You</span>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchNegotiation}
              disabled={isLoading}
              className="text-xs text-muted-foreground"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Messages */}
          <Card className="min-h-[400px] flex flex-col">
            <CardContent className="flex-1 p-4 overflow-y-auto">
              {negotiation?.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-3">
                  {negotiation?.messages.map((message) => {
                    const isOwnMessage = message.senderRole === 'SELLER';
                    const senderLabel = isOwnMessage ? 'YOU' : 'BUYER';

                    return (
                      <div
                        key={message.id}
                        className={`rounded-lg p-3 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground ml-12'
                            : 'bg-muted mr-12'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-semibold uppercase tracking-wider ${
                              isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}
                          >
                            {senderLabel}
                          </span>
                          <span
                            className={`text-xs ${
                              isOwnMessage ? 'text-primary-foreground/60' : 'text-muted-foreground'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Reply to buyer..."
                  className="min-h-[44px] max-h-[100px] resize-none"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
