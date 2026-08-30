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
  getProducts,
} from "./api";
import {
  getShop,
  getShopProducts,
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
import { ShopHero } from "./components/ShopHero";

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

type ShopThemeStyle = CSSProperties & {
  "--bg"?: string;
  "--text"?: string;
  "--shop-accent"?: string;
};

export default function App() {
  const {
    id: productIdFromUrl,
    shopSlug,
  } = useParams<AppRouteParams>();

  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [shop, setShop] = useState<Shop | null>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState(false);

  useEffect(() => {
    preloadPrankAssets();
  }, []);

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
  const isShopRoute = Boolean(shopSlug);

  const shopHomePath = shopSlug
    ? `/shop/${shopSlug}`
    : "/";

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

  useEffect(() => {
    if (!shopSlug) {
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
        const data = await getShop(shopSlug!);

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
  }, [shopSlug]);

  useEffect(() => {
    document.title = shop?.name || "SWA6Y5TAN";
  }, [shop]);

  useEffect(() => {
    if (productIdFromUrl) {
      return;
    }

    let active = true;

    async function loadProducts() {
      setLoading(true);
      setError(false);

      try {
        const data = shopSlug
          ? await getShopProducts(shopSlug, query)
          : await getProducts(query);

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
    shopSlug,
  ]);

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

  useEffect(() => {
    const startParam = consumeStartParam();

    if (!startParam) {
      return;
    }

    if (
      !productIdFromUrl ||
      productIdFromUrl !== startParam
    ) {
      const target = shopSlug
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

    if (isPrankProduct(product)) {
      void playPrankLaugh();
    } else {
      stopPrankAudio();
    }

    const target = shopSlug
      ? `/shop/${shopSlug}/product/${product.id}`
      : `/product/${product.id}`;

    navigate(target);
  }

  function closeProduct() {
    stopPrankAudio();

    setFetchedProduct(null);
    setProductLinkError(false);

    navigate(shopHomePath);
  }

  const shopThemeStyle: ShopThemeStyle = shop
    ? {
        "--bg": shop.backgroundColor,
        "--text": shop.textColor,
        "--shop-accent": shop.accentColor,
        background: shop.backgroundColor,
        color: shop.textColor,
      }
    : {};

  if (isProductPage) {
    if (isShopRoute && shopError) {
      return (
        <div
          className="app"
          style={shopThemeStyle}
        >
          <main className="product-route-state">
            <button
              type="button"
              className="product-route-state__back"
              onClick={() => navigate("/")}
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
        style={shopThemeStyle}
      >
        {selectedProduct ? (
          isPrankProduct(selectedProduct) ? (
            <PrankProduct
              onBack={closeProduct}
            />
          ) : (
            <ProductDetail
              product={selectedProduct}
              onBack={closeProduct}
              onCartClick={() =>
                setCartOpen(true)
              }
            />
          )
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

  if (isShopRoute && shopError) {
    return (
      <div className="app">
        <main className="product-route-state">
          <button
            type="button"
            className="product-route-state__back"
            onClick={() => navigate("/")}
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
      style={shopThemeStyle}
    >
      <div className="store-top">
        <Header
          onCartClick={() =>
            setCartOpen(true)
          }
          brandName={shop?.name}
          logoUrl={shop?.logoUrl}
          homePath={shopHomePath}
        />

        {isShopRoute && (
          <ShopHero
            shop={shop}
            loading={shopLoading}
          />
        )}

        <Filters
          categories={categories}
          query={query}
          onChange={(nextQuery) =>
            setQuery(nextQuery)
          }
        />
      </div>

      <main className="container">
        {loading || (isShopRoute && shopLoading) ? (
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
            {shop?.name || "SWA6Y5TAN"}
          </span>
        </div>
      </footer>
    </div>
  );
}
