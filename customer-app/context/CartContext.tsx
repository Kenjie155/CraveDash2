import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import type { MenuItem } from '../lib/types';

type Line = { item: MenuItem; qty: number };
type Ctx = {
  restaurant: { id: string; name: string } | null; lines: Line[]; count: number; subtotal: number;
  qtyOf: (id: string) => number;
  add: (item: MenuItem, restaurant: { id: string; name: string }, count?: number) => void;
  remove: (item: MenuItem) => void; clear: () => void;
};
const CartCtx = createContext<Ctx>(null as unknown as Ctx);
export const useCart = () => useContext(CartCtx);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [restaurant, setRestaurant] = useState<Ctx['restaurant']>(null);
  const [map, setMap] = useState<Record<string, Line>>({});

  const put = (item: MenuItem, base: Record<string, Line>, count: number = 1) => ({
    ...base, [item.id]: { item, qty: (base[item.id]?.qty ?? 0) + count },
  });
  const add: Ctx['add'] = (item, r, count = 1) => {
    if (restaurant && restaurant.id !== r.id && Object.keys(map).length > 0) {
      Alert.alert('Start a new cart?', `Your cart has items from ${restaurant.name}. Start a new cart with ${r.name}?`, [
        { text: 'Keep current cart', style: 'cancel' },
        { text: 'Start new cart', onPress: () => { setRestaurant(r); setMap(put(item, {}, count)); } },
      ]);
      return;
    }
    setRestaurant(r); setMap((m) => put(item, m, count));
  };
  const remove: Ctx['remove'] = (item) => setMap((m) => {
    const q = (m[item.id]?.qty ?? 0) - 1; const n = { ...m };
    if (q <= 0) delete n[item.id]; else n[item.id] = { item, qty: q };
    if (Object.keys(n).length === 0) setRestaurant(null);
    return n;
  });
  const lines = Object.values(map);
  const value: Ctx = {
    restaurant, lines, qtyOf: (id) => map[id]?.qty ?? 0,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal: lines.reduce((n, l) => n + l.qty * Number(l.item.price), 0),
    add, remove, clear: () => { setMap({}); setRestaurant(null); },
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
