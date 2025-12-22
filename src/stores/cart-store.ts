import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartVehicle } from '@/types';

interface CartStore {
  items: CartVehicle[];
  sellerNotes: Record<string, string>; // sellerId -> negotiation notes

  // Actions
  addItem: (vehicle: CartVehicle) => void;
  addItems: (vehicles: CartVehicle[]) => void;
  removeItem: (vehicleId: string) => void;
  removeItems: (vehicleIds: string[]) => void;
  clearCart: () => void;
  clearSellerItems: (sellerId: string) => void;
  updateSellerNote: (sellerId: string, note: string) => void;

  // Helpers
  isInCart: (vehicleId: string) => boolean;
  getTotal: () => number;
  getItemsBySeller: () => Record<string, CartVehicle[]>;
  getSellerNote: (sellerId: string) => string;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sellerNotes: {},

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
        const items = get().items;
        const itemToRemove = items.find((item) => item.id === vehicleId);
        const newItems = items.filter((item) => item.id !== vehicleId);
        
        // Clean up seller notes if no more items from that seller
        if (itemToRemove) {
          const sellerStillHasItems = newItems.some(
            (item) => item.sellerId === itemToRemove.sellerId
          );
          if (!sellerStillHasItems) {
            const newNotes = { ...get().sellerNotes };
            delete newNotes[itemToRemove.sellerId];
            set({ items: newItems, sellerNotes: newNotes });
            return;
          }
        }
        
        set({ items: newItems });
      },

      removeItems: (vehicleIds) => {
        const idsToRemove = new Set(vehicleIds);
        set({ items: get().items.filter((item) => !idsToRemove.has(item.id)) });
      },

      clearCart: () => set({ items: [], sellerNotes: {} }),

      clearSellerItems: (sellerId) => {
        const newNotes = { ...get().sellerNotes };
        delete newNotes[sellerId];
        set({ 
          items: get().items.filter((item) => item.sellerId !== sellerId),
          sellerNotes: newNotes 
        });
      },

      updateSellerNote: (sellerId, note) => {
        set({ 
          sellerNotes: { 
            ...get().sellerNotes, 
            [sellerId]: note 
          } 
        });
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

      getSellerNote: (sellerId) => get().sellerNotes[sellerId] || '',
    }),
    {
      name: 'cart-storage',
    }
  )
);
