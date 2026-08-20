import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getCategories,
  getProduct,
  getProducts,
} from "./api";

import type {
  Category,
  Product,
  ProductsQuery,
} from "./types";

import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { ProductDetail } from "./components/ProductDetail";
import { CartDrawer } from "./components/CartDrawer";
import { Filters } from "./components/Filters";

import { consumeStartParam } from "./telegram";

export default function App() {
  const { id: productIdFromUrl } = useParams();

  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [query, setQuery] = useState<ProductsQuery>({
    sort: "name_asc",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [fetchedProduct, setFetchedProduct] =
    useState<Product | null>(null);

  const [productLinkError, setProductLinkError] =
    useState(false);

  const [cartOpen, setCartOpen] = useState(false);

  const isProductPage = Boolean(productIdFromUrl);

  const selectedProduct = useMemo(() => {
    if (!productIdFromUrl) {
      return null;
    }

    const cached = products.find(
      (product) => product.id === productIdFromUrl,
    );

    if (cached) {
      return cached;
    }

    if (fetchedProduct?.id === productIdFromUrl) {
      return fetchedProduct;
    }

    return null;
  }, [
    productIdFromUrl,
    products,
    fetchedProduct,
  ]);

  /* =======================================================
     CATALOG
     ======================================================= */

  useEffect(() => {
    if (productIdFromUrl) {
      return;
    }

    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(false);

      try {
        const data = await getProducts(query);

        if (active) {
          setProducts(data);
        }
      } catch {
        if (active) {
          setProducts([]);
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [
    query,
    productIdFromUrl,
  ]);

  /* =======================================================
     CATEGORIES
     ======================================================= */

  useEffect(() => {
    if (productIdFromUrl) {
      return;
    }

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
  }, [productIdFromUrl]);

  /* =======================================================
     TELEGRAM START PARAM
     ======================================================= */

  useEffect(() => {
    const startParam = consumeStartParam();

    if (!startParam) {
      return;
    }

    if (
      !productIdFromUrl ||
      productIdFromUrl !== startParam
    ) {
      navigate(
        `/product/${startParam}`,
        {
          replace: true,
        },
      );
    }
  }, [
    productIdFromUrl,
    navigate,
  ]);

  /* =======================================================
     SINGLE PRODUCT
     ======================================================= */

  useEffect(() => {
    if (!productIdFromUrl) {
      setFetchedProduct(null);
      setProductLinkError(false);

      return;
    }

    const cached = products.find(
      (product) =>
        product.id === productIdFromUrl,
    );

    if (cached) {
      setProductLinkError(false);

      return;
    }

    let active = true;

    setProductLinkError(false);

    async function loadProduct() {
      try {
        const product =
          await getProduct(productIdFromUrl!);

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

    void loadProduct();

    return () => {
      active = false;
    };
  }, [
    productIdFromUrl,
    products,
  ]);

  function openProduct(product: Product) {
    setProductLinkError(false);

    navigate(
      `/product/${product.id}`,
    );
  }

  function closeProduct() {
    setFetchedProduct(null);
    setProductLinkError(false);

    navigate("/");
  }

  /* =======================================================
     PRODUCT PAGE
     ======================================================= */

  if (isProductPage) {
    return (
      <div className="app">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={closeProduct}
            onCartClick={() =>
              setCartOpen(true)
            }
          />
        ) : productLinkError ? (
          <main className="product-route-state">
            <button
              type="button"
              className="product-route-state__back"
              onClick={closeProduct}
            >
              ←
            </button>

            <div className="product-route-state__text">
              ТОВАР НЕ НАЙДЕН
            </div>
          </main>
        ) : (
          <main className="product-route-state">
            <div className="product-route-state__text">
              ЗАГРУЗКА
            </div>
          </main>
        )}

        {cartOpen && (
          <CartDrawer
            onClose={() =>
              setCartOpen(false)
            }
          />
        )}
      </div>
    );
  }

  /* =======================================================
     CATALOG PAGE
     ======================================================= */

  return (
    <div className="app">
      <div className="store-top">
        <Header
          onCartClick={() =>
            setCartOpen(true)
          }
        />

        <Filters
          categories={categories}
          query={query}
          onChange={(nextQuery) =>
            setQuery(nextQuery)
          }
        />
      </div>

      <main className="container">
        {loading ? (
          <div className="grid grid--skeleton">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                className="skeleton-card"
                key={index}
              >
                <div className="skeleton-card__media" />

                <div className="skeleton-card__line skeleton-card__line--short" />

                <div className="skeleton-card__line" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="state">
            <div className="state__icon">
              !
            </div>

            Не удалось загрузить товары.
            Проверьте подключение и обновите страницу.
          </div>
        ) : products.length === 0 ? (
          <div className="state">
            <div className="state__icon">
              ∅
            </div>

            По выбранным фильтрам товаров нет
          </div>
        ) : (
          <div className="grid">
            {products.map(
              (product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onClick={() =>
                    openProduct(product)
                  }
                />
              ),
            )}
          </div>
        )}
      </main>

      {cartOpen && (
        <CartDrawer
          onClose={() =>
            setCartOpen(false)
          }
        />
      )}

      <footer className="footer">
        <div className="container footer__inner">
          <span className="footer__brand">
            SWA6Y5TAN
          </span>
        </div>
      </footer>
    </div>
  );
}