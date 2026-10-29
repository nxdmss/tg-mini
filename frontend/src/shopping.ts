import { useSyncExternalStore } from 'react';
import { api, authHeaders, getAccessToken } from './api';
import { getTelegramInitData } from './telegram';
import type { CartItem } from './types';

type State = { items: CartItem[]; ids: string[]; ready: boolean; error: string };
type Operation = { type: 'cart'; productId: string; size: string; quantity: number } |
  { type: 'favorite'; productId: string; active: boolean } | { type: 'clear' };
let state: State = { items: [], ids: [], ready: false, error: '' };
const listeners = new Set<() => void>();
let identity = '';
let generation = 0;
let pending = 0;
let queue = Promise.resolve();
const emit = (next: State) => { state = next; listeners.forEach(fn => fn()); };
const credentials = () => getTelegramInitData() || getAccessToken() || '';
function guest(): State {
  try {
    const items = JSON.parse(localStorage.getItem('tgmini.cart.v1') || '[]');
    const ids = JSON.parse(localStorage.getItem('swagystan:favorites:v1') || '[]');
    return { items: Array.isArray(items) ? items.filter(x => x && typeof x.productId === 'string' && Number.isFinite(x.quantity) && x.quantity > 0 && Number.isFinite(x.price)) : [],
      ids: Array.isArray(ids) ? ids.filter(x => typeof x === 'string') : [], ready: true, error: '' };
  } catch { return { items: [], ids: [], ready: true, error: '' }; }
}
async function refresh(reset = false) {
  const next = credentials();
  if (reset || identity !== next) {
    identity = next;
    generation++;
    pending = 0;
    queue = Promise.resolve();
    emit(next ? { items: [], ids: [], ready: false, error: '' } : guest());
  }
  if (!next || pending) return;
  const version = generation;
  const before = state;
  try {
    const { data } = await api.get('/account/shopping', { headers: authHeaders() });
    if (version === generation && !pending && before === state)
      emit({ ...data, ready: true, error: '' });
  } catch {
    if (version === generation && !pending)
      emit({ ...state, error: 'Не удалось загрузить корзину и избранное. Проверьте вход и обновите страницу.' });
  }
}
function change(operation: Operation, next: State) {
  if (credentials() !== identity) { void refresh(true); return; }
  if (!state.ready) return;
  emit(next);
  if (!identity) {
    try {
      localStorage.setItem('tgmini.cart.v1', JSON.stringify(next.items));
      localStorage.setItem('swagystan:favorites:v1', JSON.stringify(next.ids));
    } catch { /* Guest state remains available for this visit. */ }
    return;
  }
  const version = generation;
  const headers = authHeaders();
  pending++;
  queue = queue.then(async () => {
    if (version !== generation) return;
    try {
      await api.post('/account/shopping', operation, { headers });
    } catch {
      if (version === generation) emit({ ...state, error: 'Изменение не сохранено. Проверьте соединение и повторите.' });
    } finally {
      if (version === generation) {
        pending--;
        if (!pending) {
          const error = state.error;
          await refresh();
          if (error && version === generation) emit({ ...state, error });
        }
      }
    }
  });
}
export const shopping = {
  add(item: CartItem) {
    if (item.maxStock <= 0) return;
    const existing = state.items.find(x => x.productId === item.productId && x.size === item.size);
    const quantity = Math.min(999, item.maxStock, (existing?.quantity || 0) + item.quantity);
    const items = state.items.filter(x => x !== existing);
    change({ type: 'cart', productId: item.productId, size: item.size, quantity }, { ...state, error: '', items: [...items, { ...item, quantity }] });
  },
  setQuantity(productId: string, size: string, value: number) {
    const item = state.items.find(x => x.productId === productId && x.size === size);
    if (!item) return;
    const quantity = Math.max(0, Math.min(999, item.maxStock, Math.floor(value)));
    change({ type: 'cart', productId, size, quantity }, { ...state, error: '', items: state.items.flatMap(x => x === item ? quantity ? [{ ...x, quantity }] : [] : [x]) });
  },
  remove(productId: string, size: string) { shopping.setQuantity(productId, size, 0); },
  clear() { change({ type: 'clear' }, { ...state, error: '', items: [] }); },
  toggle(productId: string) {
    const active = !state.ids.includes(productId);
    change({ type: 'favorite', productId, active }, { ...state, error: '', ids: active ? [...state.ids, productId] : state.ids.filter(id => id !== productId) });
  },
};
export function useShopping() {
  return useSyncExternalStore(callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, () => state);
}
window.addEventListener('swag:auth', () => { void refresh(true); });
window.addEventListener('storage', () => { if (credentials() !== identity || !identity) void refresh(true); });
window.addEventListener('focus', () => { void refresh(); });
window.addEventListener('online', () => { void refresh(); });
void refresh(true);
