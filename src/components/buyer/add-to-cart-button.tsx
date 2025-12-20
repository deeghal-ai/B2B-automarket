'use client';

import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { ShoppingCart, Check } from 'lucide-react';
import type { CartVehicle } from '@/types';

interface Props {
  vehicle: CartVehicle;
  className?: string;
}

export function AddToCartButton({ vehicle, className }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => state.isInCart(vehicle.id));

  if (isInCart) {
    return (
      <Button variant="outline" className={className} disabled>
        <Check className="h-4 w-4 mr-2" />
        In Cart
      </Button>
    );
  }

  return (
    <Button onClick={() => addItem(vehicle)} className={className}>
      <ShoppingCart className="h-4 w-4 mr-2" />
      Add to Cart
    </Button>
  );
}
