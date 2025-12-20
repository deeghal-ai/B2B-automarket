'use client';

import { useCartStore } from '@/stores/cart-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trash2, ShoppingCart } from 'lucide-react';
import { formatPrice, formatMileage, truncateVin } from '@/lib/utils';

export default function CartPage() {
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
        <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">
          Browse vehicles and add them to your cart for bulk purchase.
        </p>
        <Link href="/buyer">
          <Button>Browse Vehicles</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {items.length} vehicle{items.length !== 1 ? 's' : ''} from {sellerCount} seller{sellerCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => {
          const sellerTotal = sellerItems.reduce((sum, item) => sum + item.price, 0);
          
          return (
            <Card key={sellerId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{sellerItems[0].sellerName}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Subtotal: {formatPrice(sellerTotal)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sellerItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-md"
                  >
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={`${item.make} ${item.model}`}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-2xl">🚗</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.make} {item.model} {item.variant} {item.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.color} • {formatMileage(item.mileage)} • VIN: {truncateVin(item.vin)}
                      </p>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold">{formatPrice(item.price)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Total: {items.length} vehicles from {sellerCount} seller{sellerCount !== 1 ? 's' : ''}
              </p>
              <p className="text-2xl font-bold">{formatPrice(total)}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/buyer">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              <Button>Proceed to Checkout</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
