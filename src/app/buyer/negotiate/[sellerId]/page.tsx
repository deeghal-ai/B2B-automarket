'use client';

import { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/stores/cart-store';
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
}

export default function NegotiatePage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.sellerId as string;
  const hasInitialized = useRef(false);
  const removeItems = useCartStore((state) => state.removeItems);

  // Get seller name from cart (for display before negotiation loads)
  const sellerName = useCartStore((state) => {
    const item = state.items.find((i) => i.sellerId === sellerId);
    return item?.sellerName || 'Seller';
  });

  const [negotiation, setNegotiation] = useState<NegotiationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvedDeals, setApprovedDeals] = useState<{ id: string; itemCount: number }[]>([]);

  // Local state for editable fields
  const [localOfferPrices, setLocalOfferPrices] = useState<Record<string, number>>({});
  const [localIncoterm, setLocalIncoterm] = useState('FOB');
  const [localDepositPercent, setLocalDepositPercent] = useState(10);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const initializeLocalState = (data: NegotiationData) => {
    const prices: Record<string, number> = {};
    data.items.forEach((item) => {
      prices[item.vehicleId] = Number(item.offerPrice);
    });
    setLocalOfferPrices(prices);
    setLocalIncoterm(data.incoterm);
    setLocalDepositPercent(data.depositPercent);
  };

  // Add new cart items to an existing negotiation
  const addNewItemsToNegotiation = async (
    negotiationId: string,
    currentCartItems: { id: string; price: number }[],
    existingVehicleIds: Set<string>
  ) => {
    const newCartItems = currentCartItems.filter(
      (item) => !existingVehicleIds.has(item.id)
    );

    if (newCartItems.length === 0) return null;

    const response = await fetch(`/api/negotiations/${negotiationId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: newCartItems.map((item) => ({
          vehicleId: item.id,
          offerPrice: item.price || 0,
        })),
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  };

  // Initialize negotiation - only runs once on mount
  useEffect(() => {
    if (hasInitialized.current || !sellerId) return;
    hasInitialized.current = true;

    const initializeNegotiation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get current cart items for this seller
        const currentCartItems = useCartStore.getState().items.filter(
          (item) => item.sellerId === sellerId
        );

        // Use optimized API with sellerId filter for quick lookup
        const listResponse = await fetch(
          `/api/negotiations?role=buyer&sellerId=${sellerId}&minimal=true`
        );
        
        if (listResponse.ok) {
          const negotiations = await listResponse.json();
          
          // Check for approved deals (completed negotiations)
          const approved = negotiations.filter(
            (n: { sellerId: string; status: NegotiationStatus; itemCount?: number }) =>
              n.sellerId === sellerId && n.status === 'SELLER_APPROVED'
          );
          if (approved.length > 0) {
            setApprovedDeals(
              approved.map((d: { id: string; itemCount?: number }) => ({
                id: d.id,
                itemCount: d.itemCount || 0,
              }))
            );
          }

          // Find active negotiation (DRAFT or BUYER_FINALIZED only - NOT approved)
          const existing = negotiations.find(
            (n: { sellerId: string; status: NegotiationStatus }) =>
              n.sellerId === sellerId &&
              ['DRAFT', 'BUYER_FINALIZED'].includes(n.status)
          );

          if (existing) {
            // Fetch full details
            const detailResponse = await fetch(`/api/negotiations/${existing.id}`);
            if (detailResponse.ok) {
              let data = await detailResponse.json();

              // Check if there are new cart items to add (only for DRAFT status)
              if (data.status === 'DRAFT' && currentCartItems.length > 0) {
                const existingVehicleIds = new Set<string>(
                  data.items.map((item: NegotiationItem) => item.vehicleId)
                );
                
                const updatedData = await addNewItemsToNegotiation(
                  existing.id,
                  currentCartItems.map((item) => ({ id: item.id, price: item.price ?? 0 })),
                  existingVehicleIds
                );

                if (updatedData && updatedData.added > 0) {
                  data = updatedData;
                }
              }

              setNegotiation(data);
              initializeLocalState(data);
              setIsLoading(false);
              return;
            }
          }
        }

        // No existing negotiation, create new one
        if (currentCartItems.length === 0) {
          setError('No items in cart for this seller');
          setIsLoading(false);
          return;
        }

        const createResponse = await fetch('/api/negotiations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerId,
            items: currentCartItems.map((item) => ({
              vehicleId: item.id,
              offerPrice: item.price || 0,
            })),
            incoterm: currentCartItems[0]?.incoterm || 'FOB',
            depositPercent: 10,
          }),
        });

        if (createResponse.status === 409) {
          const data = await createResponse.json();
          if (data.existingId) {
            const existingResponse = await fetch(`/api/negotiations/${data.existingId}`);
            if (existingResponse.ok) {
              const existingData = await existingResponse.json();
              setNegotiation(existingData);
              initializeLocalState(existingData);
              setIsLoading(false);
              return;
            }
          }
          throw new Error(data.error);
        }

        if (!createResponse.ok) {
          const data = await createResponse.json();
          throw new Error(data.error || 'Failed to create negotiation');
        }

        const data = await createResponse.json();
        setNegotiation({ ...data, userRole: 'BUYER' });
        initializeLocalState(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    initializeNegotiation();
  }, [sellerId]);

  // Calculate totals
  const systemTotal = negotiation?.items.reduce(
    (sum, item) => sum + Number(item.systemPrice),
    0
  ) || 0;
  const negotiatedTotal = negotiation?.items.reduce(
    (sum, item) => sum + (localOfferPrices[item.vehicleId] ?? Number(item.offerPrice)),
    0
  ) || 0;
  const savings = systemTotal - negotiatedTotal;
  const tokenDueNow = negotiatedTotal * (localDepositPercent / 100);
  const finalBalance = negotiatedTotal - tokenDueNow;

  const canEdit = negotiation?.status === 'DRAFT' && negotiation?.userRole === 'BUYER';
  const isFinalized = negotiation?.status === 'BUYER_FINALIZED';
  const isApproved = negotiation?.status === 'SELLER_APPROVED';
  const buyerFinalized = isFinalized || isApproved;
  const sellerApproved = isApproved;

  const handleUpdateTerms = async (data: {
    items?: { vehicleId: string; offerPrice: number }[];
    incoterm?: string;
    depositPercent?: number;
  }) => {
    if (!negotiation || !canEdit) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/negotiations/${negotiation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updated = await response.json();
        setNegotiation(updated);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOfferPriceChange = (vehicleId: string, value: string) => {
    const price = parseFloat(value) || 0;
    setLocalOfferPrices((prev) => ({ ...prev, [vehicleId]: price }));
  };

  const handleOfferPriceBlur = (vehicleId: string) => {
    if (!canEdit) return;
    const price = localOfferPrices[vehicleId];
    if (price !== undefined) {
      handleUpdateTerms({ items: [{ vehicleId, offerPrice: price }] });
    }
  };

  const handleIncotermChange = (value: string) => {
    setLocalIncoterm(value);
    if (canEdit) {
      handleUpdateTerms({ incoterm: value });
    }
  };

  const handleDepositChange = (value: number) => {
    setLocalDepositPercent(value);
    if (canEdit) {
      handleUpdateTerms({ depositPercent: value });
    }
  };

  const handleFinalize = async () => {
    if (!negotiation) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/negotiations/${negotiation.id}/finalize`, {
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

  const handleRefresh = async () => {
    if (!negotiation) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/negotiations/${negotiation.id}`);
      if (response.ok) {
        const data = await response.json();
        setNegotiation(data);
        initializeLocalState(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // When negotiation becomes approved, clear cart items and redirect to deals
  useEffect(() => {
    if (negotiation?.status === 'SELLER_APPROVED') {
      // Clear the items from cart that are in this negotiation
      const vehicleIds = negotiation.items.map((item) => item.vehicleId);
      if (vehicleIds.length > 0) {
        removeItems(vehicleIds);
      }
      // Redirect to the deals page
      router.push(`/buyer/deals/${negotiation.id}`);
    }
  }, [negotiation?.status, negotiation?.id, negotiation?.items, removeItems, router]);

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
          <Link href="/buyer/cart">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const assetCount = negotiation?.items.length || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/buyer/cart"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>

        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Negotiation with {negotiation?.seller?.companyName || sellerName}
              </h1>
              <Badge variant="secondary">
                {assetCount} ASSET{assetCount !== 1 ? 'S' : ''}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm uppercase tracking-wider mt-1">
              Grouped Seller-Level Deal Room
            </p>
          </div>
        </div>
      </div>

      {/* Approved Deals Banner */}
      {approvedDeals.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  You have {approvedDeals.length} approved deal{approvedDeals.length > 1 ? 's' : ''} with {negotiation?.seller?.companyName || sellerName} ready for checkout
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {approvedDeals.reduce((sum, d) => sum + d.itemCount, 0)} vehicle{approvedDeals.reduce((sum, d) => sum + d.itemCount, 0) !== 1 ? 's' : ''} total
                </p>
              </div>
            </div>
            <Link href="/buyer/deals">
              <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Deal
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Price & Terms */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="text-primary">$</span>
            <span>Price & Terms Breakdown</span>
          </div>

          {/* Vehicle Items */}
          <div className="space-y-4">
            {negotiation?.items.map((item) => {
              const vehicle = item.vehicle;
              const primaryImage = vehicle?.images?.[0]?.url;
              const offerPrice = localOfferPrices[item.vehicleId] ?? Number(item.offerPrice);
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
                              System Price
                            </p>
                            <p className="font-medium">
                              {formatPrice(Number(item.systemPrice))}
                            </p>
                          </div>
                        </div>

                        {/* Offer Input */}
                        <div className="flex items-center gap-6">
                          <div className="flex-1">
                            <label className="text-xs text-primary uppercase tracking-wider font-medium">
                              Offer Per Unit
                            </label>
                            <div className="flex items-center mt-1">
                              <span className="text-muted-foreground mr-2">$</span>
                              <Input
                                type="number"
                                value={offerPrice}
                                onChange={(e) =>
                                  handleOfferPriceChange(item.vehicleId, e.target.value)
                                }
                                onBlur={() => handleOfferPriceBlur(item.vehicleId)}
                                disabled={!canEdit}
                                className="h-9"
                              />
                            </div>
                          </div>
                          <div className="text-right">
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">
                              Savings
                            </label>
                            <p
                              className={`font-medium ${
                                itemSavings >= 0 ? 'text-green-600' : 'text-red-600'
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

          {/* Terms Selection */}
          <div className="grid grid-cols-2 gap-6">
            {/* Incoterm */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                Incoterm Selection
              </label>
              <div className="flex gap-2">
                {['FOB', 'CIF'].map((term) => (
                  <Button
                    key={term}
                    variant={localIncoterm === term ? 'default' : 'outline'}
                    onClick={() => handleIncotermChange(term)}
                    disabled={!canEdit}
                    className="flex-1"
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>

            {/* Deposit % */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                Deposit %
              </label>
              <div className="flex gap-2">
                {[10, 20, 30].map((pct) => (
                  <Button
                    key={pct}
                    variant={localDepositPercent === pct ? 'default' : 'outline'}
                    onClick={() => handleDepositChange(pct)}
                    disabled={!canEdit}
                    className="flex-1"
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs opacity-80 uppercase tracking-wider">System Total Value</p>
                  <p className="text-lg line-through opacity-60">{formatPrice(systemTotal)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-300 uppercase tracking-wider font-medium">
                    Negotiated Deal
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
              Deal Approved - Ready for Checkout
            </Button>
          ) : isFinalized ? (
            negotiation?.userRole === 'SELLER' ? (
              <Button className="w-full" size="lg" onClick={handleApprove} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Approve Terms as Seller
              </Button>
            ) : (
              <Button
                className="w-full bg-green-100 text-green-800 hover:bg-green-100 cursor-default"
                size="lg"
                disabled
              >
                <Check className="h-4 w-4 mr-2" />
                Terms Locked
              </Button>
            )
          ) : negotiation?.userRole === 'BUYER' ? (
            <Button className="w-full" size="lg" onClick={handleFinalize} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Finalize Terms as Buyer
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
              <span>Multi-Asset Discussion Thread</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    buyerFinalized ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-muted-foreground">Buyer Status</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    sellerApproved ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-muted-foreground">Seller Status</span>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
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
                    const isOwnMessage = message.senderRole === negotiation.userRole;
                    const senderLabel = isOwnMessage ? 'YOU' : message.senderRole;

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
                  placeholder="Type your counter-offer message..."
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
