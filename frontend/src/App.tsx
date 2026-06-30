import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCategories, getProduct, getProducts } from "./api";
import type { Category, Product, ProductsQuery } from "./types";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { ProductDetail } from "./components/ProductDetail";
import { CartDrawer } from "./components/CartDrawer";
import { Filters } from "./components/Filters";
import { getStartParam } from "./telegram";

export default function App() {
  const { id: productIdFromUrl } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState<ProductsQuery>({ sort: "newest" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [productLinkError, setProductLinkError] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const selectedProduct = useMemo(() => {
    if (!productIdFromUrl) return null;

    const cached = products.find((product) => product.id === productIdFromUrl);
    if (cached) return cached;
    if (fetchedProduct?.id === productIdFromUrl) return fetchedProduct;
    return null;
  }, [productIdFromUrl, products, fetchedProduct]);

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

  useEffect(() => {
    const startParam = getStartParam();

    if (!productIdFromUrl && startParam) {
      navigate(`/product/${startParam}`, { replace: true });
    }
  }, [productIdFromUrl, navigate]);

  useEffect(() => {
    if (!productIdFromUrl) return;

    const productId = productIdFromUrl;
    const cached = products.find((product) => product.id === productId);
    if (cached) return;

    let active = true;

    async function loadLinkedProduct() {
      try {
        const product = await getProduct(productId);
        if (active) {
          setFetchedProduct(product);
          setProductLinkError(false);
        }
      } catch {
        if (active) {
          setFetchedProduct(null);
          setProductLinkError(true);
        }
      }
    }

    void loadLinkedProduct();

    return () => {
      active = false;
    };
  }, [productIdFromUrl, products]);

  function openProduct(product: Product) {
    setProductLinkError(false);
    navigate(`/product/${product.id}`);
  }

  function closeProduct() {
    setFetchedProduct(null);
    setProductLinkError(false);
    navigate("/");
  }

  return (
    <div className="app">
      <div className="store-top">
        <Header onCartClick={() => setCartOpen(true)} />

        <Filters
          categories={categories}
          query={query}
          onChange={(nextQuery) => setQuery(nextQuery)}
        />
      </div>

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
        ) : productLinkError && productIdFromUrl && !selectedProduct ? (
          <div className="state">
            <div className="state__icon">!</div>
            Товар не найден или был удалён.
          </div>
        ) : (
          <div className="grid">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                onClick={() => openProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={closeProduct}
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