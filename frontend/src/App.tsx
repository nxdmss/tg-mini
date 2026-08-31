import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties } from "react";
import {
  useNavigate,
  useParams,
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

import {
  areCatalogScenesReady,
  ensureCatalogScene,
  getCatalogScene,
  primeCatalogScenes,
  setCatalogScene,
  warmSceneImages,
} from "./catalogSceneCache";
import type { Shop } from "./shopApi";

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
import { PrankProduct } from "./components/PrankProduct";
import { ShopSwitcher } from "./components/ShopSwitcher";

import "./components/ShopTransitions.css";
import "./components/ShopCommerceTheme.css";

import { consumeStartParam } from "./telegram";

import {
  isPrankProduct,
  playPrankLaugh,
  preloadPrankAssets,
  stopPrankAudio,
} from "./prank";

type AppRouteParams = {
  id?: string;
  shopSlug?: string;
};

type ShopThemeStyle =
  CSSProperties & {
    "--bg"?: string;
    "--text"?: string;
    "--shop-accent"?: string;
  };


export default function App() {
  const {
    id: productIdFromUrl,
    shopSlug,
  } =
    useParams<AppRouteParams>();

  const navigate =
    useNavigate();

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

  const [
    scenesReady,
    setScenesReady,
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



  useEffect(() => {
    preloadPrankAssets();
  }, []);

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
   * Keep every neutral catalog scene ready in memory before the user
   * switches stores. This is the "game scene preload":
   * data + every product image are warmed in advance.
   */
  useEffect(() => {
    if (
      productIdFromUrl ||
      shops.length === 0
    ) {
      return;
    }

    const sort =
      query.sort ||
      "name_asc";

    let active = true;

    const alreadyReady =
      areCatalogScenesReady(
        shops,
        sort,
      );

    setScenesReady(
      alreadyReady,
    );

    void primeCatalogScenes(
      shops,
      sort,
    ).then(() => {
      if (active) {
        setScenesReady(
          true,
        );
      }
    });

    return () => {
      active = false;
    };
  }, [
    shops,
    query.sort,
    productIdFromUrl,
  ]);

  /*
   * Whenever a normal network load completes (for example first ever
   * visit), immediately promote that catalog into the scene cache too.
   */
  useEffect(() => {
    if (
      productIdFromUrl ||
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

    setCatalogScene(
      {
        shop,
        products,
      },
      query.sort,
    );

    void warmSceneImages(
      products,
    );
  }, [
    productIdFromUrl,
    loading,
    shop,
    products,
    query.sort,
    query.category,
    query.brand,
    query.search,
    query.inStock,
  ]);

  useEffect(() => {
    const resolvedShopSlug =
      activeShopSlug;

    if (
      skipShopLoadRef.current ===
      resolvedShopSlug
    ) {
      skipShopLoadRef.current =
        null;

      setShopLoading(false);
      return;
    }

    const cachedScene =
      getCatalogScene(
        resolvedShopSlug,
        query.sort,
      );

    if (cachedScene) {
      setShop(
        cachedScene.shop,
      );
      setShopLoading(false);
      setShopError(false);
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
    query.sort,
  ]);

  useEffect(() => {
    document.title =
      shop?.name ||
      "SWA6Y5TAN";
  }, [shop]);

  useEffect(() => {
    if (
      productIdFromUrl
    ) {
      return;
    }

    const resolvedShopSlug =
      activeShopSlug;

    if (
      skipProductLoadRef.current ===
      resolvedShopSlug
    ) {
      skipProductLoadRef.current =
        null;

      setLoading(false);
      return;
    }

    const isNeutralQuery =
      !query.category &&
      !query.brand &&
      !query.search &&
      query.inStock ===
        undefined;

    const cachedScene =
      isNeutralQuery
        ? getCatalogScene(
            resolvedShopSlug,
            query.sort,
          )
        : null;

    if (cachedScene) {
      setProducts(
        cachedScene.products,
      );
      setShop(
        cachedScene.shop,
      );
      setLoading(false);
      setError(false);
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
    productIdFromUrl,
    activeShopSlug,
  ]);

  useEffect(() => {
    if (
      productIdFromUrl
    ) {
      return;
    }

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
  }, [
    productIdFromUrl,
  ]);

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
    const sort =
      query.sort ||
      "name_asc";

    void ensureCatalogScene(
      targetShop,
      sort,
      {
        warmImages:
          true,
      },
    );
  }

  async function handleSwitchShop(
    nextShop: Shop,
  ) {
    if (
      catalogPending ||
      shopSlug ===
        nextShop.slug
    ) {
      return;
    }

    const nextQuery:
      ProductsQuery = {
        sort:
          query.sort ||
          "name_asc",
      };

    /*
     * Normal path: this is already in RAM, so no network and no loader.
     * Fallback exists only for a failed/unfinished initial preload.
     */
    let scene =
      getCatalogScene(
        nextShop.slug,
        nextQuery.sort,
      );

    if (!scene) {
      setCatalogPending(
        true,
      );

      try {
        scene =
          await ensureCatalogScene(
            nextShop,
            nextQuery.sort,
            {
              warmImages:
                true,
            },
          );
      } finally {
        setCatalogPending(
          false,
        );
      }
    }

    skipShopLoadRef.current =
      nextShop.slug;

    skipProductLoadRef.current =
      nextShop.slug;

    setShop(scene.shop);
    setProducts(
      scene.products,
    );
    setError(false);
    setShopError(false);
    setLoading(false);
    setQuery(nextQuery);

    navigate(
      `/shop/${nextShop.slug}`,
    );
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
      setQuery(nextQuery);
      navigate("/");
      return;
    }

    let scene =
      getCatalogScene(
        "swagystan",
        nextQuery.sort,
      );

    if (!scene) {
      setCatalogPending(
        true,
      );

      try {
        scene =
          await ensureCatalogScene(
            baseShop,
            nextQuery.sort,
            {
              warmImages:
                true,
            },
          );
      } finally {
        setCatalogPending(
          false,
        );
      }
    }

    skipShopLoadRef.current =
      "swagystan";

    skipProductLoadRef.current =
      "swagystan";

    setShop(scene.shop);
    setProducts(
      scene.products,
    );
    setError(false);
    setShopError(false);
    setLoading(false);
    setQuery(nextQuery);

    navigate("/");
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

  const catalogTransition = {
    duration: 0.13,
    ease: [
      0.22,
      1,
      0.36,
      1,
    ] as [
      number,
      number,
      number,
      number,
    ],
  };

  if (isProductPage) {
    if (
      isShopRoute &&
      shopError
    ) {
      return (
        <div
          className="app"
          style={
            shopThemeStyle
          }
        >
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
        {selectedProduct ? (
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
              setCartOpen(
                false,
              )
            }
          />
        )}
      </div>
    );
  }

  if (
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
            catalogPending ||
            !scenesReady
          }
          onClear={
            handleClearShop
          }
        />

        <motion.div
          key={`filters-${catalogKey}`}
          className="shop-content-stage"
          initial={{
            opacity: 0.9,
            y: 2,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={
            catalogTransition
          }
        >
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
        </motion.div>
      </div>

      <motion.div
        key={`catalog-${catalogKey}`}
        className="shop-content-stage"
        initial={{
          opacity: 0.88,
          y: 3,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={
          catalogTransition
        }
      >
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
                  <ProductCard
                    key={
                      product.id
                    }
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
        </motion.div>

      {cartOpen && (
        <CartDrawer
          onClose={() =>
            setCartOpen(
              false,
            )
          }
        />
      )}
    </div>
  );
}
