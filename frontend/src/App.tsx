import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";

import {
  getCategories,
  getProduct,
} from "./api";
import {
  getShopProducts,
} from "./shopApi";
import type {
  Category,
  Product,
  ProductsQuery,
} from "./types";

import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { Filters } from "./components/Filters";

import "./components/ShopCommerceTheme.css";
import "./components/ProductOverlay.css";
import "./components/StoreExperience.css";
import "./components/SwagOnly.css";
import { useFavorites } from "./favorites";

import { consumeStartParam } from "./telegram";
import {
  isPrankProduct,
  playPrankLaugh,
  stopPrankAudio,
} from "./prank";

const loadProductDetail = () => import("./components/ProductDetail");
const ProductDetail = lazy(async () => ({
  default: (await loadProductDetail()).ProductDetail,
}));

const loadCartDrawer = () => import("./components/CartDrawer");
const CartDrawer = lazy(async () => ({
  default: (await loadCartDrawer()).CartDrawer,
}));

const PrankProduct = lazy(async () => ({
  default: (await import("./components/PrankProduct")).PrankProduct,
}));

type Section = "catalog" | "favorites" | "about";
const SWAG_SHOP_SLUG = "swagystan";

function readSection(path: string): Section {
  if (path === "/favorites") return "favorites";
  if (path === "/about") return "about";
  return "catalog";
}
function getProductId(path: string): string | null {
  const match = path.match(/^\/product\/([^/]+)\/?$/);
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return match[1]; }
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const section = readSection(location.pathname);
  const productIdFromUrl = getProductId(location.pathname);
  const isProductPage = Boolean(productIdFromUrl);
  const { ids: favoriteIds } = useFavorites();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState<ProductsQuery>({ sort: "newest" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [productLinkError, setProductLinkError] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    const oldProduct = path.match(/^\/shop\/([^/]+)\/product\/([^/]+)\/?$/);
    if (oldProduct) {
      navigate(oldProduct[1] === SWAG_SHOP_SLUG
        ? `/product/${oldProduct[2]}`
        : "/", { replace: true });
    } else if (!["/", "/catalog", "/favorites", "/about"].includes(path) && !getProductId(path)) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    let active = true;
    void getCategories()
      .then((data) => active && setCategories(data))
      .catch(() => active && setCategories([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    const effectiveQuery = section === "favorites"
      ? { sort: "newest" as const }
      : query;
    void getShopProducts(SWAG_SHOP_SLUG, effectiveQuery)
      .then((data) => { if (active) setProducts(data); })
      .catch(() => { if (active) { setProducts([]); setError(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [section, query]);

  useEffect(() => {
    const startParam = consumeStartParam();
    if (!startParam) return;

    const target = `/product/${encodeURIComponent(startParam)}`;

    if (productIdFromUrl !== startParam) {
      navigate(target, { replace: true });
    }
  }, [productIdFromUrl, navigate]);

  const selectedProduct = useMemo(() => {
    if (!productIdFromUrl) return null;
    return (
      products.find((product) => product.id === productIdFromUrl) ||
      (fetchedProduct?.id === productIdFromUrl ? fetchedProduct : null)
    );
  }, [productIdFromUrl, products, fetchedProduct]);

  useEffect(() => {
    if (!productIdFromUrl) {
      setFetchedProduct(null);
      setProductLinkError(false);
      return;
    }

    if (products.some((product) => product.id === productIdFromUrl)) {
      setProductLinkError(false);
      return;
    }

    let active = true;
    setProductLinkError(false);

    void getProduct(productIdFromUrl)
      .then((product) => {
        if (active) setFetchedProduct(product);
      })
      .catch(() => {
        if (active) {
          setFetchedProduct(null);
          setProductLinkError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [productIdFromUrl, products]);

  useEffect(() => {
    document.title = "SWAGYSTAN";

    const canonicalUrl =
      new URL(
        location.pathname,
        "https://swagystan.ru",
      );

    const canonical =
      document.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );

    if (canonical) {
      canonical.href =
        canonicalUrl.toString();
    }

    const ogUrl =
      document.querySelector<HTMLMetaElement>(
        'meta[property="og:url"]',
      );

    if (ogUrl) {
      ogUrl.content =
        canonicalUrl.toString();
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isProductPage) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isProductPage]);

  function openProduct(product: Product) {
    setProductLinkError(false);

    if (isPrankProduct(product)) {
      void playPrankLaugh();
    } else {
      stopPrankAudio();
    }

    navigate(`/product/${encodeURIComponent(product.id)}`);
  }

  function closeProduct() {
    stopPrankAudio();
    setFetchedProduct(null);
    setProductLinkError(false);
    const from = sessionStorage.getItem("swagystan:product-from");
    navigate(from === "favorites" ? "/favorites" : "/");
  }
  function openSection(next: Section) {
    navigate(next === "catalog" ? "/" : `/${next}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  const visibleProducts = section === "favorites"
    ? products.filter((product) => favoriteIds.includes(product.id))
    : products;

  const productOverlay = isProductPage ? (
    <div className="product-overlay-shell">
      <Suspense
        fallback={
          <main className="product-route-state">
            <div className="product-route-state__text">ЗАГРУЗКА</div>
          </main>
        }
      >
        {selectedProduct ? (
          isPrankProduct(selectedProduct) ? (
            <PrankProduct onBack={closeProduct} />
          ) : (
            <ProductDetail
              product={selectedProduct}
              onBack={closeProduct}
              onCartClick={() => setCartOpen(true)}
            />
          )
        ) : productLinkError ? (
          <main className="product-route-state">
            <button type="button" className="product-route-state__back" onClick={closeProduct}>‹</button>
            <div className="product-route-state__text">ТОВАР НЕ НАЙДЕН</div>
          </main>
        ) : (
          <main className="product-route-state">
            <div className="product-route-state__text">ЗАГРУЗКА</div>
          </main>
        )}
      </Suspense>
    </div>
  ) : null;

  return (
    <div className="app store-experience swag-only">
      <div className="store-top store-experience__top">
        <Header onCartClick={() => setCartOpen(true)} homePath="/" logoPosition="left" />
        <nav className="swag-nav" aria-label="Навигация магазина">
          {([
            ["catalog", "КАТАЛОГ"],
            ["favorites", "ИЗБРАННОЕ"],
            ["about", "О НАС"],
          ] as const).map(([id, title]) => (
            <button
              key={id}
              className={`swag-nav__tab ${section === id ? "is-active" : ""}`}
              type="button"
              onClick={() => openSection(id)}
              aria-current={section === id ? "page" : undefined}
            >{title}</button>
          ))}
        </nav>
        {section === "catalog" && (
          <Filters categories={categories} query={query} onChange={setQuery} />
        )}
      </div>

      {section === "about" ? (
        <main className="container swag-about">
          <p className="swag-about__eyebrow">SWAGYSTAN / INDEPENDENT SELECTION</p>
          <h1>ОДЕЖДА<br/>С ХАРАКТЕРОМ.</h1>
          <p>SWAGYSTAN — независимая подборка вещей. Здесь важны силуэт, детали и собственный стиль.</p>
          <p>Выбирай вещи, рассматривай фотографии, сохраняй понравившееся. Оформляй заказ в магазине.</p>
          <div className="swag-about__links">
            <button type="button" onClick={() => openSection("catalog")}>СМОТРЕТЬ КАТАЛОГ ↗</button>
          </div>
          <small>По вопросам о заказах, доставке и возврате обращайся по контактам магазина.</small>
        </main>
      ) : (
        <main className="container store-experience__catalog" id="catalog">
          {section === "favorites" && (
            <div className="swag-section-title">
              <h1>ИЗБРАННОЕ</h1><span>{visibleProducts.length.toString().padStart(2, "0")}</span>
            </div>
          )}
          {loading ? (
            <div className="grid grid--skeleton">
              {Array.from({ length: 6 }).map((_, index) => (
                <div className="skeleton-card" key={index}>
                  <div className="skeleton-card__media" />
                  <div className="skeleton-card__line skeleton-card__line--short" />
                  <div className="skeleton-card__line" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="swag-empty">НЕ УДАЛОСЬ ЗАГРУЗИТЬ ВЕЩИ<br/><small>ОБНОВИ СТРАНИЦУ</small></div>
          ) : visibleProducts.length === 0 ? (
            <div className="swag-empty">
              {section === "favorites" ? "ПОКА ПУСТО" : "ПОКА НЕТ ТОВАРОВ"}
              {section === "favorites" && (
                <><small>ОТКРОЙ ВЕЩЬ И НАЖМИ НА СЕРДЦЕ</small><button type="button" onClick={() => openSection("catalog")}>В КАТАЛОГ ↗</button></>
              )}
            </div>
          ) : (
            <div className="grid">
              {visibleProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  className="product-flow-item"
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.3, delay: Math.min(index * 0.025, 0.15) }}
                >
                  <ProductCard product={product} index={index} onClick={() => {
                    sessionStorage.setItem("swagystan:product-from", section);
                    openProduct(product);
                  }} />
                </motion.div>
              ))}
            </div>
          )}
        </main>
      )}

      <footer className="footer swag-footer">
        <div className="container footer__inner">
          <span className="footer__brand">SWAGYSTAN</span>
          <button type="button" onClick={() => openSection("about")}>О НАС ↗</button>
        </div>
      </footer>
      {productOverlay}
      {cartOpen && (
        <Suspense fallback={null}>
          <CartDrawer onClose={() => setCartOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
