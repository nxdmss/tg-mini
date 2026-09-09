import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  motion,
} from "motion/react";

import {
  getCategories,
  getProduct,
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
import { ShopSwitcher } from "./components/ShopSwitcher";

import "./components/ShopTransitions.css";
import "./components/ShopCommerceTheme.css";
import "./components/ProductOverlay.css";

import {
  getProductPreviewImage,
} from "./utils";

import { consumeStartParam } from "./telegram";

import {
  isPrankProduct,
  playPrankLaugh,
  stopPrankAudio,
} from "./prank";

const loadProductDetail = () =>
  import(
    "./components/ProductDetail"
  );

const ProductDetail = lazy(
  async () => ({
    default:
      (await loadProductDetail())
        .ProductDetail,
  }),
);

const loadCartDrawer = () =>
  import(
    "./components/CartDrawer"
  );

const CartDrawer = lazy(
  async () => ({
    default:
      (await loadCartDrawer())
        .CartDrawer,
  }),
);

const PrankProduct = lazy(
  async () => ({
    default:
      (
        await import(
          "./components/PrankProduct"
        )
      ).PrankProduct,
  }),
);

type StorefrontRoute = {
  shopSlug?: string;
  productId?: string;
  valid: boolean;
};

function decodePathPart(
  value: string,
) {
  try {
    return decodeURIComponent(
      value,
    );
  } catch {
    return value;
  }
}

function parseStorefrontRoute(
  pathname: string,
): StorefrontRoute {
  const parts =
    pathname
      .split("/")
      .filter(Boolean)
      .map(
        decodePathPart,
      );

  if (
    parts.length === 0 ||
    (
      parts.length === 1 &&
      parts[0] ===
        "catalog"
    )
  ) {
    return {
      valid: true,
    };
  }

  if (
    parts.length === 2 &&
    parts[0] ===
      "product" &&
    parts[1]
  ) {
    return {
      valid: true,
      productId:
        parts[1],
    };
  }

  if (
    parts.length === 2 &&
    parts[0] ===
      "shop" &&
    parts[1]
  ) {
    return {
      valid: true,
      shopSlug:
        parts[1],
    };
  }

  if (
    parts.length === 4 &&
    parts[0] ===
      "shop" &&
    parts[1] &&
    parts[2] ===
      "product" &&
    parts[3]
  ) {
    return {
      valid: true,
      shopSlug:
        parts[1],
      productId:
        parts[3],
    };
  }

  return {
    valid: false,
  };
}

type ShopThemeStyle =
  CSSProperties & {
    "--bg"?: string;
    "--text"?: string;
    "--shop-accent"?: string;
  };


type CachedCatalog = {
  shop: Shop;
  products: Product[];
};

function catalogCacheKey(
  slug: string,
  sort:
    | ProductsQuery["sort"]
    | undefined,
) {
  return `${slug}::${
    sort || "name_asc"
  }`;
}

type NetworkNavigator =
  Navigator & {
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
    };
  };

function getConnectionInfo() {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return undefined;
  }

  return (
    navigator as
      NetworkNavigator
  ).connection;
}

function canBackgroundPrefetch() {
  const connection =
    getConnectionInfo();

  if (
    connection?.saveData
  ) {
    return false;
  }

  return !(
    connection?.effectiveType ===
      "slow-2g" ||
    connection?.effectiveType ===
      "2g"
  );
}

function warmProductImages(
  products: Product[],
  limit = 6,
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const connection =
    getConnectionInfo();

  if (connection?.saveData) {
    return;
  }

  const safeLimit =
    connection?.effectiveType ===
      "slow-2g" ||
    connection?.effectiveType ===
      "2g"
      ? Math.min(limit, 1)
      : limit;

  /*
   * Warm only the cards likely to appear first.
   * Importantly, use the SAME optimized preview URL that ProductCard uses,
   * so background warming never downloads the full original photo.
   */
  products
    .slice(0, safeLimit)
    .forEach(
      (product) => {
        const url =
          getProductPreviewImage(
            product,
          );

        if (!url) {
          return;
        }

        const image =
          new Image();

        image.decoding =
          "async";

        image.src = url;

        const decode =
          () => {
            if (
              typeof image.decode ===
              "function"
            ) {
              void image
                .decode()
                .catch(
                  () =>
                    undefined,
                );
            }
          };

        if (image.complete) {
          decode();
        } else {
          image.onload =
            decode;
        }
      },
    );
}

export default function App() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const storefrontRoute =
    useMemo(
      () =>
        parseStorefrontRoute(
          location.pathname,
        ),
      [
        location.pathname,
      ],
    );

  const productIdFromUrl =
    storefrontRoute.productId;

  const shopSlug =
    storefrontRoute.shopSlug;

  useEffect(() => {
    if (
      storefrontRoute.valid
    ) {
      return;
    }

    navigate(
      "/",
      {
        replace: true,
      },
    );
  }, [
    storefrontRoute.valid,
    navigate,
  ]);

  const [
    products,
    setProducts,
  ] =
    useState<Product[]>([]);

  const [
    categories,
    setCategories,
  ] =
    useState<Category[]>([]);

  const [
    shop,
    setShop,
  ] =
    useState<Shop | null>(
      null,
    );

  const [
    shops,
    setShops,
  ] =
    useState<Shop[]>([]);

  const [
    shopLoading,
    setShopLoading,
  ] =
    useState(false);

  const [
    shopError,
    setShopError,
  ] =
    useState(false);

  const [
    catalogPending,
    setCatalogPending,
  ] =
    useState(false);

  const skipShopLoadRef =
    useRef<string | null>(
      null,
    );

  const skipProductLoadRef =
    useRef<string | null>(
      null,
    );

  const catalogScrollYRef =
    useRef(0);


  const catalogCacheRef =
    useRef<
      Map<
        string,
        CachedCatalog
      >
    >(
      new Map(),
    );

  const prefetchingRef =
    useRef<Set<string>>(
      new Set(),
    );

  const [
    query,
    setQuery,
  ] =
    useState<ProductsQuery>({
      sort: "name_asc",
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState(false);

  const [
    fetchedProduct,
    setFetchedProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    productLinkError,
    setProductLinkError,
  ] =
    useState(false);

  const [
    cartOpen,
    setCartOpen,
  ] =
    useState(false);

  /*
   * Keep ProductDetail and Cart code out of the critical startup bundle.
   * Warm those chunks only after the first page has had time to paint.
   */
  useEffect(() => {
    if (loading) {
      return;
    }

    const productTimer =
      window.setTimeout(
        () => {
          void loadProductDetail();
        },
        120,
      );

    const cartTimer =
      window.setTimeout(
        () => {
          void loadCartDrawer();
        },
        900,
      );

    return () => {
      window.clearTimeout(
        productTimer,
      );
      window.clearTimeout(
        cartTimer,
      );
    };
  }, [loading]);

  const isProductPage =
    Boolean(
      productIdFromUrl,
    );

  const isShopRoute =
    Boolean(shopSlug);

  const activeShopSlug =
    shopSlug ||
    "swagystan";

  const shopHomePath =
    shopSlug
      ? `/shop/${shopSlug}`
      : "/";

  useEffect(() => {
    if (
      !isProductPage
    ) {
      return;
    }

    catalogScrollYRef.current =
      window.scrollY;

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;

      const restoreY =
        catalogScrollYRef.current;

      window.requestAnimationFrame(
        () => {
          window.scrollTo({
            top:
              restoreY,
            left: 0,
            behavior:
              "auto",
          });
        },
      );
    };
  }, [
    isProductPage,
  ]);

  const selectedProduct =
    useMemo(() => {
      if (
        !productIdFromUrl
      ) {
        return null;
      }

      const cached =
        products.find(
          (product) =>
            product.id ===
            productIdFromUrl,
        );

      if (cached) {
        return cached;
      }

      if (
        fetchedProduct?.id ===
        productIdFromUrl
      ) {
        return fetchedProduct;
      }

      return null;
    }, [
      productIdFromUrl,
      products,
      fetchedProduct,
    ]);

  useEffect(() => {
    let active = true;

    async function loadShops() {
      try {
        const data =
          await getShops();

        if (active) {
          setShops(data);
        }
      } catch {
        if (active) {
          setShops([]);
        }
      }
    }

    void loadShops();

    return () => {
      active = false;
    };
  }, []);

  /*
   * Cache the neutral, unfiltered catalog scene. Store switching
   * resets search/category/brand and preserves only sorting.
   */
  useEffect(() => {
    if (
      loading ||
      !shop ||
      query.category ||
      query.brand ||
      query.search ||
      query.inStock !==
        undefined
    ) {
      return;
    }

    const key =
      catalogCacheKey(
        shop.slug,
        query.sort,
      );

    catalogCacheRef.current.set(
      key,
      {
        shop,
        products,
      },
    );

    warmProductImages(
      products,
      6,
    );
  }, [
    loading,
    shop,
    products,
    query.sort,
    query.category,
    query.brand,
    query.search,
    query.inStock,
  ]);

  /*
   * Preload the first stores so a click normally never waits on network.
   * Refs are updated only, so this causes no React re-render.
   */
  useEffect(() => {
    if (
      shops.length === 0 ||
      !canBackgroundPrefetch()
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          const sort =
            query.sort ||
            "name_asc";

          shops
            .filter(
              (item) =>
                item.isActive &&
                item.slug !==
                  activeShopSlug,
            )
            .slice(0, 2)
            .forEach(
              (item) => {
                const key =
                  catalogCacheKey(
                    item.slug,
                    sort,
                  );

                if (
                  catalogCacheRef.current.has(
                    key,
                  ) ||
                  prefetchingRef.current.has(
                    key,
                  )
                ) {
                  return;
                }

                prefetchingRef.current.add(
                  key,
                );

                void getShopProducts(
                  item.slug,
                  { sort },
                )
                  .then(
                    (nextProducts) => {
                      catalogCacheRef.current.set(
                        key,
                        {
                          shop: item,
                          products:
                            nextProducts,
                        },
                      );

                      warmProductImages(
                        nextProducts,
                        2,
                      );
                    },
                  )
                  .catch(() => {
                    // Prefetch failure is non-fatal.
                  })
                  .finally(() => {
                    prefetchingRef.current.delete(
                      key,
                    );
                  });
              },
            );
        },
        1200,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    shops,
    query.sort,
    activeShopSlug,
  ]);

  useEffect(() => {
    const resolvedShopSlug =
      activeShopSlug;

    const preparedShopSlug =
      skipShopLoadRef.current;

    if (preparedShopSlug) {
      /*
       * During an atomic shop switch state is committed just before
       * React Router exposes the new URL. Ignore the OLD route completely
       * in that tiny window. When the target slug arrives, consume the
       * prepared flag and keep the already committed shop.
       */
      if (
        preparedShopSlug ===
        resolvedShopSlug
      ) {
        skipShopLoadRef.current =
          null;

        setShopLoading(false);
      }

      return;
    }

    let active = true;

    async function loadShop() {
      setShopLoading(true);
      setShopError(false);

      try {
        const data =
          await getShop(
            resolvedShopSlug,
          );

        if (active) {
          setShop(data);
        }
      } catch {
        if (active) {
          setShop(null);
          setShopError(true);
        }
      } finally {
        if (active) {
          setShopLoading(false);
        }
      }
    }

    void loadShop();

    return () => {
      active = false;
    };
  }, [
    activeShopSlug,
  ]);

  useEffect(() => {
    document.title =
      shop?.name ||
      "SWA6Y5TAN";
  }, [shop]);

  useEffect(() => {
    const resolvedShopSlug =
      activeShopSlug;

    const preparedProductSlug =
      skipProductLoadRef.current;

    if (preparedProductSlug) {
      /*
       * Same protection for products: never let the outgoing route set
       * loading=true for one frame after the next catalog is already ready.
       */
      if (
        preparedProductSlug ===
        resolvedShopSlug
      ) {
        skipProductLoadRef.current =
          null;

        setLoading(false);
      }

      return;
    }

    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(false);

      try {
        const data =
          await getShopProducts(
            resolvedShopSlug,
            query,
          );

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
    activeShopSlug,
  ]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const data =
          await getCategories();

        if (active) {
          setCategories(
            data,
          );
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
    const startParam =
      consumeStartParam();

    if (!startParam) {
      return;
    }

    if (
      !productIdFromUrl ||
      productIdFromUrl !==
        startParam
    ) {
      const target =
        shopSlug
          ? `/shop/${shopSlug}/product/${startParam}`
          : `/product/${startParam}`;

      navigate(
        target,
        {
          replace: true,
        },
      );
    }
  }, [
    productIdFromUrl,
    shopSlug,
    navigate,
  ]);

  useEffect(() => {
    if (
      !productIdFromUrl
    ) {
      setFetchedProduct(
        null,
      );

      setProductLinkError(
        false,
      );

      return;
    }

    const cached =
      products.find(
        (product) =>
          product.id ===
          productIdFromUrl,
      );

    if (cached) {
      setProductLinkError(
        false,
      );

      return;
    }

    let active = true;

    setProductLinkError(
      false,
    );

    async function loadProduct() {
      try {
        const product =
          await getProduct(
            productIdFromUrl!,
          );

        if (active) {
          setFetchedProduct(
            product,
          );

          setProductLinkError(
            false,
          );
        }
      } catch {
        if (active) {
          setFetchedProduct(
            null,
          );

          setProductLinkError(
            true,
          );
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

  function prefetchShop(
    targetShop: Shop,
  ) {
    const nextQuery:
      ProductsQuery = {
        sort:
          query.sort ||
          "name_asc",
      };

    const key =
      catalogCacheKey(
        targetShop.slug,
        nextQuery.sort,
      );

    if (
      catalogCacheRef.current.has(
        key,
      ) ||
      prefetchingRef.current.has(
        key,
      )
    ) {
      return;
    }

    prefetchingRef.current.add(
      key,
    );

    void getShopProducts(
      targetShop.slug,
      nextQuery,
    )
      .then((nextProducts) => {
        catalogCacheRef.current.set(
          key,
          {
            shop: targetShop,
            products:
              nextProducts,
          },
        );

        warmProductImages(
          nextProducts,
          4,
        );
      })
      .catch(() => {
        // Prefetch failure is non-fatal.
      })
      .finally(() => {
        prefetchingRef.current.delete(
          key,
        );
      });
  }

  async function handleSwitchShop(
    nextShop: Shop,
  ) {
    if (
      catalogPending ||
      activeShopSlug ===
        nextShop.slug
    ) {
      /*
       * The base route "/" already IS SWA6Y5TAN.
       * Selecting SWA6Y5TAN there is a visual ShopSwitcher action only:
       * no route change, no products state replacement, no network request.
       */
      return;
    }

    const nextQuery:
      ProductsQuery = {
        sort:
          query.sort ||
          "name_asc",
      };

    const key =
      catalogCacheKey(
        nextShop.slug,
        nextQuery.sort,
      );

    setCatalogPending(true);

    try {
      let cached =
        catalogCacheRef.current.get(
          key,
        );

      if (!cached) {
        const nextProducts =
          await getShopProducts(
            nextShop.slug,
            nextQuery,
          );

        cached = {
          shop: nextShop,
          products:
            nextProducts,
        };

        catalogCacheRef.current.set(
          key,
          cached,
        );

        warmProductImages(
          nextProducts,
          6,
        );
      }

      skipShopLoadRef.current =
        nextShop.slug;

      skipProductLoadRef.current =
        nextShop.slug;

      setShop(cached.shop);
      setProducts(
        cached.products,
      );
      setError(false);
      setShopError(false);
      setQuery(
        (current) => {
          const alreadyNeutral =
            !current.category &&
            !current.brand &&
            !current.search &&
            current.inStock ===
              undefined &&
            current.sort ===
              nextQuery.sort;

          return alreadyNeutral
            ? current
            : nextQuery;
        },
      );

      navigate(
        `/shop/${nextShop.slug}`,
      );
    } catch {
      throw new Error(
        "SHOP_SWITCH_FAILED",
      );
    } finally {
      setCatalogPending(false);
    }
  }

  async function handleClearShop() {
    if (catalogPending) {
      return;
    }

    const baseShop =
      shops.find(
        (item) =>
          item.slug ===
          "swagystan",
      );

    if (!baseShop) {
      return;
    }

    const nextQuery:
      ProductsQuery = {
        sort:
          query.sort ||
          "name_asc",
      };

    if (
      activeShopSlug ===
      "swagystan"
    ) {
      /*
       * We are already displaying the base SWA6Y5TAN catalog.
       * Do not create a new query object and do not navigate: both would
       * retrigger effects / card entrance animations for no data change.
       */
      return;
    }

    const key =
      catalogCacheKey(
        "swagystan",
        nextQuery.sort,
      );

    setCatalogPending(true);

    try {
      let cached =
        catalogCacheRef.current.get(
          key,
        );

      if (!cached) {
        const baseProducts =
          await getShopProducts(
            "swagystan",
            nextQuery,
          );

        cached = {
          shop: baseShop,
          products:
            baseProducts,
        };

        catalogCacheRef.current.set(
          key,
          cached,
        );

        warmProductImages(
          baseProducts,
          6,
        );
      }

      skipShopLoadRef.current =
        "swagystan";

      skipProductLoadRef.current =
        "swagystan";

      setShop(cached.shop);
      setProducts(
        cached.products,
      );
      setError(false);
      setShopError(false);
      setQuery(
        (current) => {
          const alreadyNeutral =
            !current.category &&
            !current.brand &&
            !current.search &&
            current.inStock ===
              undefined &&
            current.sort ===
              nextQuery.sort;

          return alreadyNeutral
            ? current
            : nextQuery;
        },
      );

      navigate("/");
    } catch {
      throw new Error(
        "SHOP_CLEAR_FAILED",
      );
    } finally {
      setCatalogPending(false);
    }
  }

  function openProduct(
    product: Product,
  ) {
    setProductLinkError(
      false,
    );

    if (
      isPrankProduct(
        product,
      )
    ) {
      void playPrankLaugh();
    } else {
      stopPrankAudio();
    }

    const target =
      shopSlug
        ? `/shop/${shopSlug}/product/${product.id}`
        : `/product/${product.id}`;

    navigate(target);
  }

  function closeProduct() {
    stopPrankAudio();

    setFetchedProduct(
      null,
    );

    setProductLinkError(
      false,
    );

    navigate(
      shopHomePath,
    );
  }

  const shopThemeStyle:
    ShopThemeStyle =
    shop
      ? {
          "--bg":
            shop.backgroundColor,
          "--text":
            shop.textColor,
          "--shop-accent":
            shop.accentColor,
          background:
            shop.backgroundColor,
          color:
            shop.textColor,
        }
      : {};

  const catalogKey =
    shop?.slug ||
    activeShopSlug;


  const productOverlay =
    isProductPage ? (
      <div className="product-overlay-shell">
        <Suspense
          fallback={
            <main className="product-route-state">
              <div className="product-route-state__text">
                ЗАГРУЗКА
              </div>
            </main>
          }
        >
        {isShopRoute &&
        shopError ? (
          <main className="product-route-state">
            <button
              type="button"
              className="product-route-state__back"
              onClick={
                closeProduct
              }
            >
              ‹
            </button>

            <div className="product-route-state__text">
              МАГАЗИН НЕ НАЙДЕН
            </div>
          </main>
        ) : selectedProduct ? (
          isPrankProduct(
            selectedProduct,
          ) ? (
            <PrankProduct
              onBack={
                closeProduct
              }
            />
          ) : (
            <ProductDetail
              product={
                selectedProduct
              }
              onBack={
                closeProduct
              }
              onCartClick={() =>
                setCartOpen(
                  true,
                )
              }
            />
          )
        ) : productLinkError ? (
          <main className="product-route-state">
            <button
              type="button"
              className="product-route-state__back"
              onClick={
                closeProduct
              }
            >
              ‹
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
        </Suspense>
      </div>
    ) : null;


  if (
    !isProductPage &&
    isShopRoute &&
    shopError
  ) {
    return (
      <div className="app">
        <main className="product-route-state">
          <button
            type="button"
            className="product-route-state__back"
            onClick={() =>
              navigate("/")
            }
          >
            ←
          </button>

          <div className="product-route-state__text">
            МАГАЗИН НЕ НАЙДЕН
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="app"
      style={
        shopThemeStyle
      }
    >
      <div className="store-top">
        <Header
          onCartClick={() =>
            setCartOpen(
              true,
            )
          }
          homePath="/"
          logoNegative={
            shop?.slug ===
            "zulf"
          }
        />

        <ShopSwitcher
          shop={shop}
          shops={shops}
          loading={
            shopLoading
          }
          selected={
            Boolean(shopSlug)
          }
          onSelect={
            handleSwitchShop
          }
          onPrefetch={
            prefetchShop
          }
          pending={
            catalogPending
          }
          onClear={
            handleClearShop
          }
        />

        <div className="shop-content-stage">
          <Filters
            categories={
              categories
            }
            query={query}
            onChange={(
              nextQuery,
            ) =>
              setQuery(
                nextQuery,
              )
            }
          />
        </div>
      </div>

      <div className="shop-content-stage">
          <main className="container">
          {loading ||
          shopLoading ? (
            <div className="grid grid--skeleton">
              {Array.from({
                length: 6,
              }).map(
                (
                  _,
                  index,
                ) => (
                  <div
                    className="skeleton-card"
                    key={
                      index
                    }
                  >
                    <div className="skeleton-card__media" />

                    <div className="skeleton-card__line skeleton-card__line--short" />

                    <div className="skeleton-card__line" />
                  </div>
                ),
              )}
            </div>
          ) : error ? (
            <div className="state">
              <div className="state__icon">
                !
              </div>

              Не удалось
              загрузить товары.
              Проверьте
              подключение и
              обновите страницу.
            </div>
          ) : products.length ===
            0 ? (
            <div className="state">
              <div className="state__icon">
                ∅
              </div>

              В этом магазине
              пока нет товаров
            </div>
          ) : (
            <div className="grid">
              {products.map(
                (
                  product,
                  index,
                ) => (
                  <motion.div
                    key={`${catalogKey}-${product.id}`}
                    className="product-flow-item"
                    initial={{
                      opacity: 0,
                      y: 22,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.46,
                      delay:
                        Math.min(
                          index * 0.042,
                          0.30,
                        ),
                      ease: [
                        0.16,
                        1,
                        0.3,
                        1,
                      ],
                    }}
                  >
                    <ProductCard
                      product={
                        product
                      }
                      index={
                        index
                      }
                      onClick={() =>
                        openProduct(
                          product,
                        )
                      }
                    />
                  </motion.div>
                ),
              )}
            </div>
          )}
        </main>

          <footer className="footer">
            <div className="container footer__inner">
              <span className="footer__brand">
                {shop?.name ||
                  "SWA6Y5TAN"}
              </span>
            </div>
          </footer>
        </div>

      {productOverlay}

      {cartOpen && (
        <Suspense fallback={null}>
          <CartDrawer
            onClose={() =>
              setCartOpen(
                false,
              )
            }
          />
        </Suspense>
      )}
    </div>
  );
}
