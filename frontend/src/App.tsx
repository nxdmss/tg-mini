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

  // debounce search input
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
    <>
      <Header onCartClick={() => setCartOpen(true)} />

      <section className="hero">
        <div className="container">
          <h1>Гардероб без лишнего.</h1>
          <p>
            Тщательно отобранные вещи от любимых брендов. Чистые линии, честные
            цены, доставка в один клик.
          </p>
        </div>
      </section>

      <Filters
        categories={categories}
        query={query}
        count={products.length}
        onChange={setQuery}
      />

      <main className="container">
        {loading ? (
          <div className="state">
            <div className="spinner" />
            Загружаем коллекцию…
          </div>
        ) : error ? (
          <div className="state">
            Не удалось загрузить товары. Проверьте подключение и обновите страницу.
          </div>
        ) : products.length === 0 ? (
          <div className="state">Ничего не найдено</div>
        ) : (
          <div className="grid">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => setSelected(p)}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container">ATELIER · Telegram Mini App</div>
      </footer>

      {selected && (
        <ProductDetail product={selected} onClose={() => setSelected(null)} />
      )}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  );
}
