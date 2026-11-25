import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

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
import { Account } from "./components/Account";
import { ProductCard } from "./components/ProductCard";
import { StoreIntro, wasIntroSeen } from "./components/StoreIntro";
import { CatalogQuickAdd } from "./components/CatalogQuickAdd";
import { Filters } from "./components/Filters";
import { StoreHeroScreen } from "./components/StoreHeroScreen";

import "./components/ShopCommerceTheme.css";
import "./components/ProductOverlay.css";
import "./components/StoreExperience.css";
import "./components/SwagOnly.css";
import "./components/MobileRefinement.css";
import "./components/CatalogCardStates.css";
import { useFavorites } from "./favorites";
import { sendVisitorPing } from "./visitorTracking";

import { consumeStartParam } from "./telegram";

import { ProductDetail } from "./components/ProductDetail";

const loadCartDrawer = () => import("./components/CartDrawer");
const CartDrawer = lazy(async () => ({
  default: (await loadCartDrawer()).CartDrawer,
}));

type Section = "catalog" | "favorites" | "about" | "account";
const SECTION_ORDER: readonly Section[] = ["catalog", "favorites", "about", "account"];
const SWAG_SHOP_SLUG = "swagystan";

function readSection(path: string): Section {
  if (path === "/favorites") return "favorites";
  if (path === "/about") return "about";
  if (path === "/account") return "account";
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
  const [introRevealed, setIntroRevealed] = useState(wasIntroSeen);
  const revealIntro = useCallback(() => setIntroRevealed(true), []);

  // First-party anonymous visits: page changes and heartbeat while visible.
  useEffect(() => {
    void sendVisitorPing(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void sendVisitorPing(window.location.pathname);
    }, 60_000);
    const onVisible = () => {
      if (!document.hidden) void sendVisitorPing(window.location.pathname);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const productIdFromUrl = getProductId(location.pathname);
  const isProductPage = Boolean(productIdFromUrl);
  const section = readSection(isProductPage ? sessionStorage.getItem("swagystan:product-path") || "/catalog" : location.pathname);
  const swipeTransition = { duration: reducedMotion ? 0 : 0.58, ease: [0.4, 0, 0.2, 1] as const };
  const isLanding = location.pathname === "/" && !isProductPage;
  const landingDuration = reducedMotion ? 0 : 0.55;
  const previousLanding = useRef(isLanding);
  const previousSection = useRef(section);
  const fromLanding = previousLanding.current;
  const swipeDirection = SECTION_ORDER.indexOf(section) < SECTION_ORDER.indexOf(previousSection.current) ? -1 : 1;
  useEffect(() => {
    previousLanding.current = isLanding;
    previousSection.current = section;
  }, [isLanding, section]);
  const fadeTransition = { duration: reducedMotion ? 0 : 0.32, ease: [0.4, 0, 0.2, 1] as const };

  // iOS uses the PWA theme as a fallback behind the system status bar.
  // Keep the landing video warm-toned, but return to white on shopping pages.
  useEffect(() => {
    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    theme?.setAttribute("content", isLanding ? "#080808" : "#ffffff");
    return () => theme?.setAttribute("content", "#ffffff");
  }, [isLanding]);

  const { ids: favoriteIds, isFavorite, toggle } = useFavorites();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState<ProductsQuery>({ sort: "newest" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [productLinkError, setProductLinkError] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartReopenToken, setCartReopenToken] = useState(0);
  function openCart() { setCartOpen(true); setCartReopenToken(value => value + 1); }

  useEffect(() => {
    const path = location.pathname;
    const oldProduct = path.match(/^\/shop\/([^/]+)\/product\/([^/]+)\/?$/);
    if (oldProduct) {
      navigate(oldProduct[1] === SWAG_SHOP_SLUG
        ? `/product/${oldProduct[2]}`
        : "/", { replace: true });
    } else if (!["/", "/catalog", "/favorites", "/about", "/account"].includes(path) && !getProductId(path)) {
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
    setLoading(products.length === 0);
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

  const [productExiting, setProductExiting] = useState(false);
  const productScrollLocked = isProductPage || productExiting;
  useLayoutEffect(() => {
    if (!productScrollLocked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [productScrollLocked]);
  useLayoutEffect(() => { if (isProductPage) setProductExiting(true); }, [isProductPage]);
  useEffect(() => { void loadCartDrawer(); }, []);

  function openProduct(product: Product) {
    setProductLinkError(false);

    navigate(`/product/${encodeURIComponent(product.id)}`);
  }

  function closeProduct() {
    setProductLinkError(false);
    const from = sessionStorage.getItem("swagystan:product-from");
    const fromPath = sessionStorage.getItem("swagystan:product-path");
    navigate(fromPath && fromPath !== "/" ? fromPath : from === "favorites" ? "/favorites" : "/catalog");
  }
  function openSection(next: Section) {
    navigate(next === "catalog" ? "/catalog" : `/${next}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  const visibleProducts = section === "favorites"
    ? products.filter((product) => favoriteIds.includes(product.id))
    : products;

  const productOverlay = isProductPage ? (
    <motion.div
      key="product-overlay"
      className="product-overlay-shell"
      style={{ isolation: "isolate", background: "#fff" }}
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1, pointerEvents: "none", transition: { duration: reducedMotion ? 0 : 0.18 } }}
      transition={fadeTransition}
    >
      <motion.div initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
      <Suspense
        fallback={
          <main className="product-route-state">
            <div className="product-route-state__text">ЗАГРУЗКА</div>
          </main>
        }
      >
        {selectedProduct ? (
          <ProductDetail
            key={selectedProduct.id}
            product={selectedProduct}
            onBack={closeProduct}
            onCartClick={openCart}
          />
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
      </motion.div>
    </motion.div>
  ) : null;

  return (
    <div className={`app store-experience swag-only ${isLanding ? "swag-landing" : ""} ${introRevealed ? "swag-intro-revealed" : "swag-intro-hidden"}`}>
      <StoreIntro catalogLoading={isLanding ? false : loading} onReveal={revealIntro} />
      <div className="store-top store-experience__top">
        <Header
          onCartClick={openCart}
          homePath={isLanding ? "/catalog" : "/"}
          logoPosition={isLanding ? "center" : "left"}
          landing={isLanding}
          showCart={!isLanding}
          onLogoClick={isLanding ? () => navigate("/catalog") : undefined}
          navItems={isLanding ? undefined : [
            { id: "catalog", title: "КАТАЛОГ", active: section === "catalog", onSelect: () => openSection("catalog") },
            { id: "favorites", title: "ИЗБРАННОЕ", active: section === "favorites", onSelect: () => openSection("favorites") },
            { id: "about", title: "О НАС", active: section === "about", onSelect: () => openSection("about") },
            { id: "account", title: "КАБИНЕТ", active: section === "account", onSelect: () => openSection("account") },
          ]}
        />
        {!isLanding && section === "catalog" && (
          <Filters categories={categories} query={query} onChange={setQuery} />
        )}
      </div>

          <motion.div
            key="landing-video"
            className="swag-hero-layer"
            onClick={() => navigate("/catalog")}
            role="button"
            tabIndex={isLanding ? 0 : -1}
            aria-label="Перейти в каталог SWAGYSTAN"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/catalog");
              }
            }}
            initial={false}
            animate={{ opacity: isLanding ? 1 : 0 }}
            style={{ pointerEvents: isLanding ? "auto" : "none", zIndex: 19 }}
            aria-hidden={!isLanding}
            transition={{ duration: landingDuration, ease: "easeInOut" }}
          >
            <StoreHeroScreen active={isLanding} />
          </motion.div>


      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", overflow: "clip" }}>
      <AnimatePresence initial={false} custom={{ toLanding: isLanding, direction: swipeDirection }}>
          <motion.div
            key={section}
            className="swag-page-transition"
            style={{ gridArea: "1 / 1", minWidth: 0, background: "var(--bg)", pointerEvents: isLanding ? "none" : "auto" }}
            initial={reducedMotion ? false : fromLanding ? { x: 0, opacity: 1 } : { x: swipeDirection === 1 ? "100%" : "-100%", opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            variants={{ leaving: ({ toLanding, direction }: { toLanding: boolean; direction: number }) => ({
              x: toLanding || reducedMotion ? 0 : direction === 1 ? "-100%" : "100%",
              opacity: 1,
              pointerEvents: "none",
              transition: toLanding ? { ...fadeTransition, duration: landingDuration } : swipeTransition,
            }) }}
            exit="leaving"
            transition={fromLanding ? { ...fadeTransition, duration: reducedMotion ? 0 : 0.6 } : swipeTransition}
          >
            {section === "account" ? (
        <Account />
      ) : section === "about" ? (
        <main className="container swag-about swag-about--textonly">
          <div className="swag-about__cityline">KIZILURT | DAGESTAN</div>
          <div className="swag-about__cityline swag-about__cityline--bottom">KIZILURT | DAGESTAN</div>
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
              {visibleProducts.map((product, index) => {
                const favorite = isFavorite(product.id);
                return (
                  <div key={product.id} className="product-flow-item">
                    <div className={`swag-card-wrap${product.inStock ? "" : " is-sold-out"}`}>
                      <button
                        type="button"
                        className={`swag-card-like ${favorite ? "is-favorite" : ""}`}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggle(product.id);
                        }}
                        aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"}
                        aria-pressed={favorite}
                        title={favorite ? "Убрать из избранного" : "В избранное"}
                      >
                        <img
                          src={favorite ? "/icons/swag-heart-filled.svg" : "/icons/swag-heart-outline.svg"}
                          alt=""
                          aria-hidden="true"
                        />
                      </button>
                      {section === "catalog" && <CatalogQuickAdd product={product} />}
                      <ProductCard
                        product={product}
                        index={index}
                        onClick={() => {
                          sessionStorage.setItem("swagystan:product-from", section);
                          sessionStorage.setItem("swagystan:product-path", location.pathname === "/" ? "/catalog" : location.pathname);
                          openProduct(product);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
            )}
          </motion.div>
      </AnimatePresence>
      </div>

      {!isLanding && (
        <motion.footer className="footer swag-footer" initial={false} animate={{ opacity: isLanding ? 0 : 1 }} transition={{ duration: landingDuration, ease: "easeInOut" }} style={{ pointerEvents: isLanding ? "none" : "auto" }}>
          <div className="container footer__inner">
            <span className="footer__brand">SWAGYSTAN © <span className="swag-num">{new Date().getFullYear()}</span></span>
            <button type="button" onClick={() => openSection("about")}>О НАС ↗</button>
          </div>
        </motion.footer>
      )}
      <AnimatePresence initial={false} onExitComplete={() => setProductExiting(false)}>{productOverlay}</AnimatePresence>
      <Suspense fallback={null}>
        <AnimatePresence initial={false}>
          {cartOpen && <CartDrawer key="cart-window" reopenToken={cartReopenToken} onClose={() => setCartOpen(false)} />}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
