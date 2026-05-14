import { create } from "zustand";
import type { CartAction, CartItem, MenuItem } from "../types";

interface CartState {
  items: CartItem[];
  addItem: (item: MenuItem, quantity: number, modifiers?: string[]) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
  applyActions: (actions: CartAction[], menu: MenuItem[]) => void;
  total: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],

  addItem: (item, quantity, modifiers) =>
    set((state) => {
      const idx = state.items.findIndex((it) => it.id === item.id);
      if (idx >= 0) {
        const next = state.items.slice();
        const existing = next[idx];
        next[idx] = { ...existing, quantity: existing.quantity + quantity };
        return { items: next };
      }
      const { modifiers: _menuMods, ...rest } = item; const newLine: CartItem = { ...rest, quantity, modifiers };
      return { items: [...state.items, newLine] };
    }),

  removeItem: (itemId, quantity) =>
    set((state) => {
      const idx = state.items.findIndex((it) => it.id === itemId);
      if (idx < 0) return state;
      if (quantity === undefined) {
        return { items: state.items.filter((it) => it.id !== itemId) };
      }
      const next = state.items.slice();
      const existing = next[idx];
      const newQty = existing.quantity - quantity;
      if (newQty <= 0) {
        return { items: state.items.filter((it) => it.id !== itemId) };
      }
      next[idx] = { ...existing, quantity: newQty };
      return { items: next };
    }),

  setQuantity: (itemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((it) => it.id !== itemId) };
      }
      const idx = state.items.findIndex((it) => it.id === itemId);
      if (idx < 0) return state;
      const next = state.items.slice();
      next[idx] = { ...next[idx], quantity };
      return { items: next };
    }),

  clear: () => set({ items: [] }),

  applyActions: (actions, menu) => {
    const { addItem, removeItem, setQuantity, clear } = get();
    for (const action of actions) {
      switch (action.type) {
        case "ADD": {
          const item = menu.find((m) => m.id === action.itemId);
          if (!item) continue;
          addItem(item, action.quantity, action.modifiers);
          break;
        }
        case "REMOVE":
          removeItem(action.itemId, action.quantity);
          break;
        case "UPDATE_QUANTITY":
          setQuantity(action.itemId, action.quantity);
          break;
        case "CLEAR":
          clear();
          break;
      }
    }
  },

  total: () => get().items.reduce((sum, it) => sum + it.price * it.quantity, 0),
}));

