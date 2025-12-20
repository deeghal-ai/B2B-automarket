# Feature Spec: Shopping Cart

## Overview

The cart allows buyers to collect vehicles from multiple sellers for bulk purchase. Cart state is managed client-side with Zustand and persisted to localStorage.

## User Stories

### US-1: Add Single Vehicle to Cart
**As a** buyer
**I want to** add a vehicle from the detail page to my cart
**So that** I can purchase it later

### US-2: Add Multiple Vehicles to Cart
**As a** buyer
**I want to** add multiple vehicles from a group at once
**So that** I can efficiently build my bulk order

### US-3: View Cart
**As a** buyer
**I want to** see all vehicles in my cart grouped by seller
**So that** I understand my order structure

### US-4: Remove from Cart
**As a** buyer
**I want to** remove vehicles from my cart
**So that** I can adjust my order

### US-5: Cart Persistence
**As a** buyer
**I want to** my cart to persist across page refreshes
**So that** I don't lose my selections

## UI Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🛒 Shopping Cart                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ Seller: ABC Auto Trading (China) ───────────────────────────────┐  │
│  │                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ ☐ │ 📷 │ Toyota Camry LE 2022 White │ 25,000km │ $18,500  │  │  │
│  │  │   │    │ VIN: ...A4B2C3              │          │ [Remove] │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ ☐ │ 📷 │ Toyota Camry SE 2022 White │ 32,000km │ $19,200  │  │  │
│  │  │   │    │ VIN: ...X7Y8Z9              │          │ [Remove] │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  │  Subtotal (2 vehicles): $37,700                                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─ Seller: XYZ Motors (China) ─────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ ☐ │ 📷 │ Honda Accord Sport 2022    │ 18,000km │ $21,000  │  │  │
│  │  │   │    │ VIN: ...M3N4O5              │          │ [Remove] │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                   │  │
│  │  Subtotal (1 vehicle): $21,000                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Total: 3 vehicles from 2 sellers                                       │
│  Grand Total: $58,700 USD                                              │
│                                                                         │
│  [Continue Shopping]                        [Proceed to Checkout →]    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Zustand Store

```typescript
// src/stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartVehicle {
  id: string;
  sellerId: string;
  sellerName: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  color: string;
  mileage: number;
  price: number;
  vin: string;
  imageUrl: string | null;
}

interface CartStore {
  items: CartVehicle[];
  
  // Actions
  addItem: (vehicle: CartVehicle) => void;
  addItems: (vehicles: CartVehicle[]) => void;
  removeItem: (vehicleId: string) => void;
  removeItems: (vehicleIds: string[]) => void;
  clearCart: () => void;
  clearSellerItems: (sellerId: string) => void;
  
  // Computed (as functions since Zustand doesn't have computed)
  getItemCount: () => number;
  getTotal: () => number;
  getItemsBySeller: () => Record<string, CartVehicle[]>;
  isInCart: (vehicleId: string) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (vehicle) => {
        const items = get().items;
        if (!items.find(item => item.id === vehicle.id)) {
          set({ items: [...items, vehicle] });
        }
      },
      
      addItems: (vehicles) => {
        const items = get().items;
        const existingIds = new Set(items.map(i => i.id));
        const newItems = vehicles.filter(v => !existingIds.has(v.id));
        set({ items: [...items, ...newItems] });
      },
      
      removeItem: (vehicleId) => {
        set({ items: get().items.filter(item => item.id !== vehicleId) });
      },
      
      removeItems: (vehicleIds) => {
        const idsToRemove = new Set(vehicleIds);
        set({ items: get().items.filter(item => !idsToRemove.has(item.id)) });
      },
      
      clearCart: () => set({ items: [] }),
      
      clearSellerItems: (sellerId) => {
        set({ items: get().items.filter(item => item.sellerId !== sellerId) });
      },
      
      getItemCount: () => get().items.length,
      
      getTotal: () => get().items.reduce((sum, item) => sum + item.price, 0),
      
      getItemsBySeller: () => {
        const items = get().items;
        return items.reduce((acc, item) => {
          if (!acc[item.sellerId]) {
            acc[item.sellerId] = [];
          }
          acc[item.sellerId].push(item);
          return acc;
        }, {} as Record<string, CartVehicle[]>);
      },
      
      isInCart: (vehicleId) => get().items.some(item => item.id === vehicleId),
    }),
    {
      name: 'cart-storage', // localStorage key
    }
  )
);
```

### Cart Page Component

```typescript
// src/app/buyer/cart/page.tsx
'use client';

import { useCartStore } from '@/stores/cart-store';
import { CartSellerGroup } from '@/components/buyer/cart-seller-group';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CartPage() {
  const items = useCartStore(state => state.items);
  const getItemsBySeller = useCartStore(state => state.getItemsBySeller);
  const getTotal = useCartStore(state => state.getTotal);
  
  const itemsBySeller = getItemsBySeller();
  const total = getTotal();
  const sellerCount = Object.keys(itemsBySeller).length;
  
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
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
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>
      
      <div className="space-y-6">
        {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => (
          <CartSellerGroup
            key={sellerId}
            sellerId={sellerId}
            sellerName={sellerItems[0].sellerName}
            items={sellerItems}
          />
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">
              Total: {items.length} vehicles from {sellerCount} seller{sellerCount > 1 ? 's' : ''}
            </p>
            <p className="text-2xl font-bold">
              ${total.toLocaleString()} USD
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/buyer">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
            <Link href="/buyer/checkout">
              <Button>Proceed to Checkout</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Cart Badge Component

```typescript
// src/components/shared/cart-badge.tsx
'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function CartBadge() {
  const itemCount = useCartStore(state => state.getItemCount());
  
  return (
    <Link href="/buyer/cart" className="relative">
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <Badge 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Link>
  );
}
```

## Files to Create

```
src/
├── stores/
│   └── cart-store.ts
├── app/
│   └── buyer/
│       └── cart/
│           └── page.tsx
└── components/
    ├── buyer/
    │   ├── cart-seller-group.tsx
    │   ├── cart-item.tsx
    │   └── cart-summary.tsx
    └── shared/
        └── cart-badge.tsx
```

## Edge Cases

1. **Vehicle sold while in cart**: Check availability on checkout
2. **Price changed while in cart**: Show price change notification
3. **Cart item limit**: Consider max 100 items for MVP
4. **Duplicate prevention**: Don't allow same vehicle twice

