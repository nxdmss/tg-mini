import { useEffect, useState } from "react";
import { getProducts } from "./api";
import type { Product } from "./types";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { ProductDetail } from "./components/ProductDetail";
import { CartDrawer } from "./components/CartDrawer";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(false);

      try {
        const data = await getProducts();

        if (active) {
          setProducts(data);
        }
      } catch {
        if (active) {
          setError(true);
          setProducts([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="app">
      <Header onCartClick={() => setCartOpen(true)} />

      <main className="container">
        {loading ? (
          <div className="grid grid--skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-card__media" />
                <div className="skeleton-card__line skeleton-card__line--short" />
                <div className="skeleton-card__line" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="state">
            <div className="state__icon">!</div>
            Не удалось загрузить товары. Проверьте подключение и обновите страницу.
          </div>
        ) : products.length === 0 ? (
          <div className="state">
            <div className="state__icon">∅</div>
            Товаров пока нет
          </div>
        ) : (
          <div className="grid">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                onClick={() => setSelected(p)}
              />
            ))}
          </div>
        )}
      </main>

      {selected && (
        <ProductDetail
          product={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {cartOpen && (
        <CartDrawer
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}