'use client';

import { useCartStore } from '@/stores/cart-store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Trash2, 
  FileText, 
  ArrowLeft, 
  User, 
  Handshake,
  ArrowRight
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function QuoteBuilderPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemsBySeller = useCartStore((state) => state.getItemsBySeller);

  const total = getTotal();
  const itemsBySeller = getItemsBySeller();
  const sellerCount = Object.keys(itemsBySeller).length;

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your quote is empty</h1>
        <p className="text-muted-foreground mb-6">
          Browse vehicles and add them to build your quote request.
        </p>
        <Link href="/buyer">
          <Button>Browse Vehicles</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/buyer" 
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Quote Builder</h1>
            <p className="text-muted-foreground">
              {items.length} vehicle{items.length !== 1 ? 's' : ''} from {sellerCount} seller{sellerCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={clearCart}
          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Seller groups */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => {
            const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price ?? 0), 0);
            const sellerName = sellerItems[0].sellerName;
            
            return (
              <Card key={sellerId} className="overflow-hidden">
                {/* Seller header */}
                <CardHeader className="pb-3 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sellerName}</span>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Verified Seller
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Seller Total</p>
                      <p className="text-lg font-bold">{formatPrice(sellerTotal, sellerItems[0].currency || 'USD')}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 space-y-4">
                  {/* Vehicle items */}
                  {sellerItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border"
                    >
                      {/* Vehicle image */}
                      <div className="relative w-24 h-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={`${item.make} ${item.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">🚗</span>
                        )}
                      </div>
                      
                      {/* Vehicle info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">
                          {item.year} {item.make} {item.model}
                          {item.variant && ` ${item.variant}`}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.color}
                        </p>
                      </div>
                      
                      {/* Price and actions */}
                      <div className="text-right flex-shrink-0">
                        <div className="mb-1">
                          <span className="text-sm text-muted-foreground">Unit Price</span>
                          <div className="flex items-center justify-end gap-1.5">
                            <p className="font-bold text-lg">{formatPrice(item.price, item.currency || 'USD')}</p>
                            {item.incoterm && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                                {item.incoterm}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Negotiate button */}
                  <div className="pt-2 border-t">
                    <Link href={`/buyer/negotiate/${sellerId}`}>
                      <Button className="w-full" size="lg">
                        <Handshake className="h-4 w-4 mr-2" />
                        Negotiate with {sellerName}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right column - Quote Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Quote Summary</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Breakdown by seller */}
              <div>
                <h3 className="font-medium mb-3">Breakdown by Seller</h3>
                <div className="space-y-3">
                  {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => {
                    const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price ?? 0), 0);
                    const sellerName = sellerItems[0].sellerName;
                    const currency = sellerItems[0].currency || 'USD';
                    
                    return (
                      <div key={sellerId} className="text-sm">
                        <div className="flex justify-between font-medium">
                          <span>{sellerName}</span>
                          <span>{formatPrice(sellerTotal, currency)}</span>
                        </div>
                        {sellerItems.map((item) => (
                          <div key={item.id} className="flex justify-between text-muted-foreground pl-2 mt-1">
                            <span className="truncate pr-2">
                              {item.year} {item.make} {item.model}
                            </span>
                            <span className="flex-shrink-0">{formatPrice(item.price, currency)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Vehicles:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Sellers:</span>
                  <span className="font-medium">{sellerCount}</span>
                </div>
              </div>

              {/* Grand total */}
              <div className="bg-primary text-primary-foreground p-4 rounded-lg -mx-1">
                <div className="text-sm opacity-90">Grand Total</div>
                <div className="text-2xl font-bold">
                  {formatPrice(total, items[0]?.currency || 'USD')}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Handshake className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How to proceed:</p>
                    <p>Click &quot;Negotiate&quot; on each seller group to propose your terms, discuss pricing, and finalize the deal.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
