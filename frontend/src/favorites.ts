import { shopping, useShopping } from './shopping';
export function useFavorites() {
  const { ids, ready } = useShopping();
  return { ids, ready, isFavorite: (id: string) => ids.includes(id), toggle: shopping.toggle };
}
