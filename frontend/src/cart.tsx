import type { ReactNode } from 'react';
import { shopping, useShopping } from './shopping';

export function CartProvider({ children }: { children: ReactNode }) {
  const { error } = useShopping();
  return <>{error && <div role="alert" style={{ position: 'fixed', bottom: 12, left: 12, right: 12, zIndex: 10000, padding: 12, background: '#111', color: '#fff', fontSize: 13 }}>{error}</div>}{children}</>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const { items, ready } = useShopping();
  return { items, ready, count: items.reduce((sum, x) => sum + x.quantity, 0),
    total: items.reduce((sum, x) => sum + x.quantity * x.price, 0),
    add: shopping.add, setQuantity: shopping.setQuantity, remove: shopping.remove, clear: shopping.clear };
}
