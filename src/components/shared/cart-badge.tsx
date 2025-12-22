'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';

export function CartBadge() {
  const itemCount = useCartStore((state) => state.items.length);

  return (
    <Link 
      href="/buyer/cart" 
      className="relative flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      title="Quote Builder"
    >
      <FileText className="h-5 w-5" />
      <span className="hidden sm:inline">Quote</span>
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 sm:static sm:ml-0 h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
