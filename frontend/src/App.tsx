import { useEffect, useState } from "react";
import { getCategories, getProducts } from "./api";
import type { Category, Product, ProductsQuery } from "./types";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { ProductDetail } from "./components/ProductDetail";
import { CartDrawer } from "./components/CartDrawer";
import { Filters } from "./components/Filters";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState<ProductsQuery>({ sort: "newest" });
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
        const data = await getProducts(query);

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
  }, [query]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const data = await getCategories();
        if (active) {
          setCategories(data);
        }
      } catch {
        if (active) {
          setCategories([]);
        }
      }
    }

    void loadCategories();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="app">
      <Header onCartClick={() => setCartOpen(true)} />

      <Filters
        categories={categories}
        query={query}
        count={products.length}
        onChange={(nextQuery) => setQuery(nextQuery)}
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
            По выбранным фильтрам товаров нет
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

      <footer className="footer">
        <div className="container footer__inner">
          <span className="footer__brand">SWA6Y5TAN</span>
          </div>
      </footer>
    </div>
  );
}