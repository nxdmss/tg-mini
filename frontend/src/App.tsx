import { useEffect, useMemo, useState } from "react";
import { getCategories, getProducts } from "./api";
import type { Category, Product, ProductsQuery } from "./types";
import { Header } from "./components/Header";
import { Filters } from "./components/Filters";
import { ProductCard } from "./components/ProductCard";
import { ProductDetail } from "./components/ProductDetail";
import { CartDrawer } from "./components/CartDrawer";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState<ProductsQuery>({ sort: "newest" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(query.search ?? ""), 300);
    return () => clearTimeout(t);
  }, [query.search]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const effectiveQuery = useMemo(
    () => ({ ...query, search: debouncedSearch || undefined }),
    [query, debouncedSearch],
  );

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const data = await getProducts(effectiveQuery);
        if (active) setProducts(data);
      } catch {
        if (active) {
          setError(true);
          setProducts([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [effectiveQuery]);

  return (
    <div className="app">
      <Header onCartClick={() => setCartOpen(true)} />

      <section className="store-hero container" aria-label="Магазин одежды">
        <div>
          <h1>ZOV</h1>
        </div>
        <button className="store-hero__cart" onClick={() => setCartOpen(true)}>
          Корзина
        </button>
      </section>

      <Filters
        categories={categories}
        query={query}
        count={products.length}
        onChange={setQuery}
      />

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
            Ничего не найдено — попробуйте другой фильтр
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

      <footer className="footer">
        <div className="container footer__inner">
          <span className="footer__brand">ATELIER</span>
          <span className="footer__tag">Telegram Mini App</span>
        </div>
      </footer>

      {selected && (
        <ProductDetail product={selected} onClose={() => setSelected(null)} />
      )}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </div>
  );
}
