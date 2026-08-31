import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  LayoutGroup,
  motion,
} from "motion/react";

import type { Shop } from "../shopApi";

import "./ShopSwitcher.css";

type ShopSwitcherProps = {
  shop: Shop | null;
  shops: Shop[];
  loading: boolean;
  selected: boolean;
  pending: boolean;
  onSelect: (
    shop: Shop,
  ) => Promise<void>;
  onClear: () => Promise<void>;
  onPrefetch: (
    shop: Shop,
  ) => void;
};

const nameMotion = {
  duration: 0.18,
  ease: [
    0.22,
    1,
    0.36,
    1,
  ],
} as const;

export function ShopSwitcher({
  shop,
  shops,
  loading,
  selected,
  pending,
  onSelect,
  onClear,
  onPrefetch,
}: ShopSwitcherProps) {
  const [mode, setMode] =
    useState<
      "rail" | "focus"
    >(
      selected
        ? "focus"
        : "rail",
    );

  const [visualShop, setVisualShop] =
    useState<Shop | null>(
      shop,
    );

  const [pressedSlug, setPressedSlug] =
    useState<string | null>(
      null,
    );

  const activeShops =
    useMemo(
      () =>
        shops.filter(
          (item) =>
            item.isActive,
        ),
      [shops],
    );

  useEffect(() => {
    if (
      !shop ||
      pending
    ) {
      return;
    }

    setVisualShop(shop);
  }, [
    shop,
    pending,
  ]);

  useEffect(() => {
    if (pending) {
      return;
    }

    setMode(
      selected
        ? "focus"
        : "rail",
    );
  }, [
    selected,
    pending,
  ]);

  async function chooseShop(
    nextShop: Shop,
  ) {
    if (
      pending ||
      pressedSlug
    ) {
      return;
    }

    setPressedSlug(
      nextShop.slug,
    );
    setVisualShop(
      nextShop,
    );
    setMode("focus");

    try {
      await onSelect(
        nextShop,
      );
    } catch {
      setMode("rail");

      if (shop) {
        setVisualShop(shop);
      }
    } finally {
      setPressedSlug(null);
    }
  }

  async function clearShop() {
    if (
      pending ||
      !visualShop ||
      pressedSlug
    ) {
      return;
    }

    setPressedSlug(
      visualShop.slug,
    );
    setMode("rail");

    try {
      await onClear();
    } catch {
      setMode("focus");
    } finally {
      setPressedSlug(null);
    }
  }

  if (
    loading &&
    activeShops.length === 0
  ) {
    return (
      <section className="shop-switcher">
        <div className="container">
          <div className="shop-switcher__skeleton" />
        </div>
      </section>
    );
  }

  if (activeShops.length === 0) {
    return null;
  }

  const focusShop =
    visualShop ||
    shop ||
    activeShops[0];

  return (
    <section
      className={`shop-switcher ${
        pending
          ? "is-pending"
          : ""
      }`}
    >
      <div className="container shop-switcher__inner">
        <LayoutGroup id="swag-shop-switcher">
          <div className="shop-switcher__stage">
            <motion.div
              className="shop-switcher__rail"
              initial={false}
              animate={{
                opacity:
                  mode === "rail"
                    ? 1
                    : 0,
                transform:
                  mode === "rail"
                    ? "translate3d(0,0,0)"
                    : "translate3d(0,3px,0)",
              }}
              transition={{
                duration: 0.12,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
              style={{
                pointerEvents:
                  mode === "rail" &&
                  !pending
                    ? "auto"
                    : "none",
              }}
              aria-hidden={
                mode !== "rail"
              }
            >
              {activeShops.map(
                (item) => {
                  const isMoving =
                    mode === "focus" &&
                    focusShop.slug ===
                      item.slug;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className="shop-switcher__rail-item"
                      onPointerEnter={() =>
                        onPrefetch(item)
                      }
                      onPointerDown={() =>
                        onPrefetch(item)
                      }
                      onClick={() => {
                        void chooseShop(
                          item,
                        );
                      }}
                      disabled={pending}
                      aria-label={`Открыть магазин ${item.name}`}
                    >
                      {isMoving ? (
                        <span
                          className="shop-switcher__rail-placeholder"
                          aria-hidden="true"
                        >
                          {item.name}
                        </span>
                      ) : (
                        <motion.span
                          className="shop-switcher__name shop-switcher__name--rail"
                          layoutId={`shop-name-${item.slug}`}
                          transition={{
                            layout:
                              nameMotion,
                          }}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </button>
                  );
                },
              )}
            </motion.div>

            <AnimatePresence initial={false}>
              {mode === "focus" && (
                <motion.button
                  key={`focus-${focusShop.slug}`}
                  type="button"
                  className="shop-switcher__focus"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.08,
                  }}
                  onClick={() => {
                    void clearShop();
                  }}
                  disabled={pending}
                  aria-label={`Вернуть ${focusShop.name} в строку магазинов`}
                >
                  <motion.span
                    className="shop-switcher__name shop-switcher__name--focus"
                    layoutId={`shop-name-${focusShop.slug}`}
                    transition={{
                      layout:
                        nameMotion,
                    }}
                  >
                    {focusShop.name}
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="shop-switcher__details-slot">
            <motion.div
              className="shop-switcher__details"
              initial={false}
              animate={{
                opacity:
                  mode === "focus"
                    ? 1
                    : 0,
                transform:
                  mode === "focus"
                    ? "translate3d(0,0,0)"
                    : "translate3d(0,-2px,0)",
              }}
              transition={{
                duration: 0.1,
              }}
              aria-hidden={
                mode !== "focus"
              }
            >
              <span className="shop-switcher__description">
                {focusShop.description || ""}
              </span>

              <span className="shop-switcher__meta">
                {focusShop.productCount} товаров
              </span>
            </motion.div>
          </div>
        </LayoutGroup>
      </div>
    </section>
  );
}
