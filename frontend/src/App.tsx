import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CSSProperties } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

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
import { ProductDetail } from "./components/ProductDetail";
import { CartDrawer } from "./components/CartDrawer";
import { Filters } from "./components/Filters";
import { PrankProduct } from "./components/PrankProduct";
import { MarketplaceHome } from "./components/MarketplaceHome";
import { StoreIdentity } from "./components/StoreIdentity";

import "./components/StoreTransitions.css";

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
  } = useParams<AppRouteParams>();

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
    shopsLoading,
    setShopsLoading,
  ] =
    useState(true);

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
    openingSlug,
    setOpeningSlug,
  ] =
    useState<string | null>(
      null,
    );

  const [
    leavingStore,
    setLeavingStore,
  ] =
    useState(false);

  const [
    justEnteredStore,
    setJustEnteredStore,
  ] =
    useState(true);

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
    useState(false);

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

  const isMarketplaceHome =
    !shopSlug &&
    !productIdFromUrl;

  const activeShopSlug =
    shopSlug ||
    (productIdFromUrl
      ? "swagystan"
      : null);

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
      setShopsLoading(true);

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
      } finally {
        if (active) {
          setShopsLoading(
            false,
          );
        }
      }
    }

    void loadShops();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeShopSlug) {
      setShop(null);
      setShopError(false);
      setShopLoading(false);
      return;
    }

    let active = true;

    async function loadShop() {
      setShopLoading(true);
      setShopError(false);

      try {
        const data =
          await getShop(
            activeShopSlug,
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
      isMarketplaceHome
        ? "SWAG"
        : shop?.name ||
          "SWAG";
  }, [
    isMarketplaceHome,
    shop,
  ]);

  useEffect(() => {
    if (
      !activeShopSlug ||
      productIdFromUrl
    ) {
      if (
        isMarketplaceHome
      ) {
        setProducts([]);
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
            activeShopSlug,
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
    isMarketplaceHome,
  ]);

  useEffect(() => {
    if (
      isMarketplaceHome
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
    isMarketplaceHome,
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

  useEffect(() => {
    if (
      !shopSlug ||
      shopLoading ||
      !shop
    ) {
      return;
    }

    setJustEnteredStore(
      true,
    );

    const timer =
      window.setTimeout(
        () => {
          setJustEnteredStore(
            false,
          );
        },
        650,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    shopSlug,
    shopLoading,
    shop,
  ]);

  function openStore(
    nextShop: Shop,
  ) {
    if (openingSlug) {
      return;
    }

    setOpeningSlug(
      nextShop.slug,
    );

    window.setTimeout(
      () => {
        setQuery({
          sort: "name_asc",
        });

        navigate(
          `/shop/${nextShop.slug}`,
        );

        setOpeningSlug(
          null,
        );
      },
      470,
    );
  }

  function backToStores() {
    if (leavingStore) {
      return;
    }

    setLeavingStore(true);

    window.setTimeout(
      () => {
        setQuery({
          sort: "name_asc",
        });

        navigate("/");

        setLeavingStore(
          false,
        );
      },
      320,
    );
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

    if (shopSlug) {
      navigate(
        `/shop/${shopSlug}`,
      );
    } else {
      navigate("/");
    }
  }

  const shopThemeStyle:
    ShopThemeStyle =
    shop &&
    !isMarketplaceHome
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
      : {
          "--bg": "#ffffff",
          "--text": "#000000",
          "--shop-accent":
            "#000000",
          background:
            "#ffffff",
          color: "#000000",
        };

  if (isProductPage) {
    if (
      shopSlug &&
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
              onClick={
                backToStores
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
    activeShopSlug &&
    shopError
  ) {
    return (
      <div
        className="app"
        style={
          shopThemeStyle
        }
      >
        <Header
          onCartClick={() =>
            setCartOpen(
              true,
            )
          }
          homePath="/"
        />

        <main className="product-route-state">
          <button
            type="button"
            className="product-route-state__back"
            onClick={
              backToStores
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

  if (isMarketplaceHome) {
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
          />
        </div>

        <MarketplaceHome
          shops={shops}
          loading={
            shopsLoading
          }
          openingSlug={
            openingSlug
          }
          onOpen={
            openStore
          }
        />

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
        />

        {shop && (
          <StoreIdentity
            shop={shop}
            leaving={
              leavingStore
            }
            onBack={
              backToStores
            }
          />
        )}

        <div
          className={`store-catalog-stage ${
            leavingStore
              ? "is-leaving"
              : justEnteredStore
                ? "is-entering"
                : ""
          }`}
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
        </div>
      </div>

      <div
        className={`store-catalog-stage ${
          leavingStore
            ? "is-leaving"
            : justEnteredStore
              ? "is-entering"
              : ""
        }`}
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
                "SWAG"}
            </span>
          </div>
        </footer>
      </div>

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
