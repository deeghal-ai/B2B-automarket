import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartVehicle } from '@/types';

interface CartStore {
  items: CartVehicle[];

  // Actions
  addItem: (vehicle: CartVehicle) => void;
  addItems: (vehicles: CartVehicle[]) => void;
  removeItem: (vehicleId: string) => void;
  removeItems: (vehicleIds: string[]) => void;
  clearCart: () => void;
  clearSellerItems: (sellerId: string) => void;

  // Helpers
  isInCart: (vehicleId: string) => boolean;
  getTotal: () => number;
  getItemsBySeller: () => Record<string, CartVehicle[]>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (vehicle) => {
        const items = get().items;
        if (!items.find((item) => item.id === vehicle.id)) {
          set({ items: [...items, vehicle] });
        }
      },

      addItems: (vehicles) => {
        const items = get().items;
        const existingIds = new Set(items.map((i) => i.id));
        const newItems = vehicles.filter((v) => !existingIds.has(v.id));
        if (newItems.length > 0) {
          set({ items: [...items, ...newItems] });
        }
      },

      removeItem: (vehicleId) => {
        set({ items: get().items.filter((item) => item.id !== vehicleId) });
      },

      removeItems: (vehicleIds) => {
        const idsToRemove = new Set(vehicleIds);
        set({ items: get().items.filter((item) => !idsToRemove.has(item.id)) });
      },

      clearCart: () => set({ items: [] }),

      clearSellerItems: (sellerId) => {
        set({ items: get().items.filter((item) => item.sellerId !== sellerId) });
      },

      isInCart: (vehicleId) => get().items.some((item) => item.id === vehicleId),

      getTotal: () => get().items.reduce((sum, item) => sum + (item.price ?? 0), 0),

      getItemsBySeller: () => {
        const items = get().items;
        return items.reduce(
          (acc, item) => {
            if (!acc[item.sellerId]) {
              acc[item.sellerId] = [];
            }
            acc[item.sellerId].push(item);
            return acc;
          },
          {} as Record<string, CartVehicle[]>
        );
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
