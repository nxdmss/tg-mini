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
};

const nameSpring = {
  type: "spring",
  stiffness: 520,
  damping: 46,
  mass: 0.82,
} as const;

export function ShopSwitcher({
  shop,
  shops,
  loading,
  selected,
  pending,
  onSelect,
  onClear,
}: ShopSwitcherProps) {
  const [
    mode,
    setMode,
  ] = useState<
    "rail" | "focus"
  >(
    selected
      ? "focus"
      : "rail",
  );

  const [
    visualShop,
    setVisualShop,
  ] =
    useState<Shop | null>(
      shop,
    );

  const [
    pressedSlug,
    setPressedSlug,
  ] =
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

    /*
     * This single state change is what Motion needs:
     * the same layoutId disappears from the rail and appears
     * in the focused position. No manual coordinates or timers.
     */
    setMode("focus");

    try {
      await onSelect(
        nextShop,
      );
    } catch {
      /*
       * If loading fails, return to the neutral rail instead of
       * leaving the interface in a fake selected state.
       */
      setMode("rail");

      if (shop) {
        setVisualShop(
          shop,
        );
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

    /*
     * The focused shared element now reappears in its original
     * rail position with the same layoutId. Motion performs the
     * reverse transition automatically.
     */
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

  if (
    activeShops.length === 0
  ) {
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
              layout
              layoutScroll
              initial={false}
              animate={{
                opacity:
                  mode === "rail"
                    ? 1
                    : 0,
                y:
                  mode === "rail"
                    ? 0
                    : 5,
              }}
              transition={{
                opacity: {
                  duration: 0.18,
                },
                layout:
                  nameSpring,
                y: {
                  duration: 0.22,
                  ease: [
                    0.22,
                    1,
                    0.36,
                    1,
                  ],
                },
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
                    <motion.button
                      type="button"
                      key={
                        item.id
                      }
                      className="shop-switcher__rail-item"
                      layout="position"
                      onClick={() => {
                        void chooseShop(
                          item,
                        );
                      }}
                      whileTap={{
                        scale: 0.97,
                      }}
                      disabled={
                        pending
                      }
                      aria-label={`Открыть магазин ${item.name}`}
                    >
                      {isMoving ? (
                        <span
                          className="shop-switcher__rail-placeholder"
                          aria-hidden="true"
                        >
                          {
                            item.name
                          }
                        </span>
                      ) : (
                        <motion.span
                          className="shop-switcher__name shop-switcher__name--rail"
                          layoutId={`shop-name-${item.slug}`}
                          transition={{
                            layout:
                              nameSpring,
                          }}
                        >
                          {
                            item.name
                          }
                        </motion.span>
                      )}
                    </motion.button>
                  );
                },
              )}
            </motion.div>

            <AnimatePresence
              initial={false}
            >
              {mode ===
                "focus" && (
                <motion.button
                  key={`focus-${focusShop.slug}`}
                  type="button"
                  className="shop-switcher__focus"
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                  transition={{
                    opacity: {
                      duration:
                        0.16,
                    },
                  }}
                  onClick={() => {
                    void clearShop();
                  }}
                  disabled={
                    pending
                  }
                  aria-label={`Вернуть ${focusShop.name} в строку магазинов`}
                >
                  <motion.span
                    className="shop-switcher__name shop-switcher__name--focus"
                    layoutId={`shop-name-${focusShop.slug}`}
                    transition={{
                      layout:
                        nameSpring,
                    }}
                  >
                    {
                      focusShop.name
                    }
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence
            initial={false}
          >
            {mode ===
              "focus" &&
              visualShop && (
                <motion.div
                  key={`details-${visualShop.slug}`}
                  className="shop-switcher__details"
                  initial={{
                    opacity: 0,
                    height: 0,
                    y: -4,
                  }}
                  animate={{
                    opacity: 1,
                    height: "auto",
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    y: -3,
                  }}
                  transition={{
                    duration:
                      0.24,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                >
                  {visualShop.description && (
                    <p className="shop-switcher__description">
                      {
                        visualShop.description
                      }
                    </p>
                  )}

                  <div className="shop-switcher__meta">
                    {
                      visualShop.productCount
                    }{" "}
                    товаров
                  </div>
                </motion.div>
              )}
          </AnimatePresence>
        </LayoutGroup>

        <AnimatePresence>
          {pending && (
            <motion.div
              className="shop-switcher__progress"
              initial={{
                scaleX: 0,
                opacity: 0,
              }}
              animate={{
                scaleX: 1,
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.32,
                ease: [
                  0.22,
                  1,
                  0.36,
                  1,
                ],
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
