'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';

export function CartBadge() {
  const itemCount = useCartStore((state) => state.items.length);

  return (
    <Link href="/buyer/cart" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
