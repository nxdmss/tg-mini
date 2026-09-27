import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import {
  getCategories,
  getProduct,
  getProducts,
} from "./api";
import {
  getShop,
  getShopProducts,
  getShops,
} from "./shopApi";
import type { Shop } from "./shopApi";
import type {
  Category,
  Product,
  ProductsQuery,
} from "./types";

import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { Filters } from "./components/Filters";
import { StoreTabs } from "./components/StoreTabs";
import { StoreDirectory } from "./components/StoreDirectory";
import { StoreName } from "./components/StoreName";
import { ZulfiaRiverBackground } from "./components/ZulfiaRiverBackground";

import "./components/ShopCommerceTheme.css";
import "./components/ProductOverlay.css";
import "./components/StoreExperience.css";

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

type RouteState = {
  valid: boolean;
  view: "for-you" | "stores" | "shop";
  shopSlug?: string;
  productId?: string;
};

function decodePart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseRoute(pathname: string): RouteState {
  const parts = pathname.split("/").filter(Boolean).map(decodePart);

  if (parts.length === 0 || (parts.length === 1 && parts[0] === "catalog")) {
    return { valid: true, view: "for-you" };
  }

  if (parts.length === 1 && parts[0] === "stores") {
    return { valid: true, view: "stores" };
  }

  if (parts.length === 2 && parts[0] === "product" && parts[1]) {
    return { valid: true, view: "for-you", productId: parts[1] };
  }

  if (parts.length === 2 && parts[0] === "shop" && parts[1]) {
    return { valid: true, view: "shop", shopSlug: parts[1] };
  }

  if (
    parts.length === 4 &&
    parts[0] === "shop" &&
    parts[1] &&
    parts[2] === "product" &&
    parts[3]
  ) {
    return {
      valid: true,
      view: "shop",
      shopSlug: parts[1],
      productId: parts[3],
    };
  }

  return { valid: false, view: "for-you" };
}

type ShopThemeStyle = CSSProperties & {
  "--bg"?: string;
  "--text"?: string;
  "--shop-accent"?: string;
};

function mixProducts(items: Product[]) {
  return [...items].sort((a, b) => {
    const score = (value: string) => {
      let result = 0;
      for (let i = 0; i < value.length; i += 1) {
        result = (result * 31 + value.charCodeAt(i)) >>> 0;
      }
      return result;
    };

    return score(a.id) - score(b.id);
  });
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const route = useMemo(() => parseRoute(location.pathname), [location.pathname]);
  const { view, shopSlug, productId: productIdFromUrl } = route;
  const isProductPage = Boolean(productIdFromUrl);
  const isStoresView = view === "stores";
  const isShopView = view === "shop";
  const isForYouView = view === "for-you";

  const [shops, setShops] = useState<Shop[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState<ProductsQuery>({ sort: "newest" });
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(false);
  const [error, setError] = useState(false);
  const [shopError, setShopError] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [productLinkError, setProductLinkError] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!route.valid) {
      navigate("/", { replace: true });
    }
  }, [route.valid, navigate]);

  useEffect(() => {
    let active = true;
    void getShops()
      .then((data) => active && setShops(data))
      .catch(() => active && setShops([]));
    return () => {
      active = false;
    };
  }, []);

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
    if (!isShopView || !shopSlug) {
      setShop(null);
      setShopError(false);
      return;
    }

    const cached = shops.find((item) => item.slug === shopSlug);
    if (cached) {
      setShop(cached);
      setShopError(false);
      return;
    }

    let active = true;
    setShopLoading(true);
    setShopError(false);

    void getShop(shopSlug)
      .then((data) => active && setShop(data))
      .catch(() => {
        if (active) {
          setShop(null);
          setShopError(true);
        }
      })
      .finally(() => active && setShopLoading(false));

    return () => {
      active = false;
    };
  }, [isShopView, shopSlug, shops]);

  useEffect(() => {
    if (isStoresView) {
      setLoading(false);
      setError(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(false);

    const request = isShopView && shopSlug
      ? getShopProducts(shopSlug, query)
      : getProducts(query);

    void request
      .then((data) => {
        if (!active) return;
        setProducts(isForYouView ? mixProducts(data) : data);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
        setError(true);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [isStoresView, isShopView, isForYouView, shopSlug, query]);

  useEffect(() => {
    const startParam = consumeStartParam();
    if (!startParam) return;

    const target = shopSlug
      ? `/shop/${shopSlug}/product/${startParam}`
      : `/product/${startParam}`;

    if (productIdFromUrl !== startParam) {
      navigate(target, { replace: true });
    }
  }, [productIdFromUrl, shopSlug, navigate]);

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
    document.title = isShopView && shop ? shop.name : "SWA6Y5TAN";
  }, [isShopView, shop]);

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

    navigate(
      shopSlug
        ? `/shop/${shopSlug}/product/${product.id}`
        : `/product/${product.id}`,
    );
  }

  function closeProduct() {
    stopPrankAudio();
    setFetchedProduct(null);
    setProductLinkError(false);
    navigate(shopSlug ? `/shop/${shopSlug}` : "/");
  }

  function openShop(nextShop: Shop) {
    setQuery({ sort: "newest" });
    navigate(`/shop/${nextShop.slug}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goForYou() {
    setQuery({ sort: "newest" });
    navigate("/");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goStores() {
    navigate("/stores");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  const shopThemeStyle: ShopThemeStyle = isShopView && shop
    ? {
        "--bg": shop.backgroundColor,
        "--text": shop.textColor,
        "--shop-accent": shop.accentColor,
        background: shop.backgroundColor,
        color: shop.textColor,
      }
    : {};

  const productOverlay = isProductPage ? (
    <div className="product-overlay-shell">
      <Suspense
        fallback={
          <main className="product-route-state">
            <div className="product-route-state__text">ЗАГРУЗКА</div>
          </main>
        }
      >
        {shopError ? (
          <main className="product-route-state">
            <button type="button" className="product-route-state__back" onClick={closeProduct}>‹</button>
            <div className="product-route-state__text">МАГАЗИН НЕ НАЙДЕН</div>
          </main>
        ) : selectedProduct ? (
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

  if (!isProductPage && isShopView && shopError) {
    return (
      <div className="app">
        <main className="product-route-state">
          <button type="button" className="product-route-state__back" onClick={goStores}>←</button>
          <div className="product-route-state__text">МАГАЗИН НЕ НАЙДЕН</div>
        </main>
      </div>
    );
  }

  const logoPosition = isStoresView ? "center" : "left";
  const activeTab = isForYouView ? "for-you" : "stores";

  return (
    <LayoutGroup id="store-name-flight">
      <div
        className={`app store-experience${shopSlug === "zulf" ? " app--zulfia" : ""}`}
        style={shopThemeStyle}
      >
        <ZulfiaRiverBackground
          active={isShopView && shopSlug === "zulf"}
        />
      <div className="store-top store-experience__top">
        <Header
          onCartClick={() => setCartOpen(true)}
          homePath="/"
          logoNegative={shop?.slug === "zulf"}
          logoPosition={logoPosition}
        />

        <StoreTabs
          active={activeTab}
          onForYou={goForYou}
          onStores={goStores}
        />

        {isShopView && shop && (
          <div className="store-current">
            <button
              type="button"
              className="store-current__name"
              onClick={goStores}
            >
              <StoreName
                shop={shop}
                place="current"
                reducedMotion={Boolean(reducedMotion)}
              />
            </button>
          </div>
        )}

        {!isStoresView && (
          <Filters categories={categories} query={query} onChange={setQuery} />
        )}
      </div>

      {isStoresView ? (
        <StoreDirectory
          shops={shops}
          loading={shops.length === 0}
          onOpen={openShop}
        />
      ) : (
        <main className="container store-experience__catalog">
          {loading || shopLoading ? (
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
            <div className="state">
              <div className="state__icon">!</div>
              Не удалось загрузить товары.
            </div>
          ) : products.length === 0 ? (
            <div className="state">
              <div className="state__icon">∅</div>
              Пока нет товаров
            </div>
          ) : (
            <div className="grid">
              {products.map((product, index) => (
                <motion.div
                  key={`${shopSlug || "for-you"}-${product.id}`}
                  className="product-flow-item"
                  initial={reducedMotion ? false : { opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.48,
                    delay: reducedMotion ? 0 : Math.min(index * 0.035, 0.28),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <ProductCard
                    product={product}
                    index={index}
                    onClick={() => openProduct(product)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </main>
      )}

      {!isStoresView && (
        <footer className="footer">
          <div className="container footer__inner">
            <span className="footer__brand">
              {isShopView && shop ? shop.name : "SWA6Y5TAN"}
            </span>
          </div>
        </footer>
      )}

      {productOverlay}

      {cartOpen && (
        <Suspense fallback={null}>
          <CartDrawer onClose={() => setCartOpen(false)} />
        </Suspense>
      )}
      </div>
    </LayoutGroup>
  );
}
