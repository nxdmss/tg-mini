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

import {
  useNavigate,
} from "react-router-dom";

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
  duration: 0.22,
  ease: [
    0.16,
    1,
    0.3,
    1,
  ],
} as const;

function displayShopName(
  shop: Shop,
) {
  if (shop.slug === "zulf") {
    return "Zulfia";
  }

  if (
    shop.slug === "swagystan" ||
    /^(SWA6Y5TAN|SWAGYSTAN)$/i.test(
      shop.name,
    )
  ) {
    /*
     * The DMC5 font maps the visible logo
     * through lowercase glyphs.
     */
    return "swagystan";
  }

  return shop.name;
}

function accessibleShopName(
  shop: Shop,
) {
  if (shop.slug === "zulf") {
    return "Zulfia";
  }

  if (
    shop.slug === "swagystan" ||
    /^(SWA6Y5TAN|SWAGYSTAN)$/i.test(
      shop.name,
    )
  ) {
    return "SWAGYSTAN";
  }

  return shop.name;
}

function brandClass(
  shop: Shop,
) {
  if (shop.slug === "zulf") {
    return "shop-switcher__brand shop-switcher__brand--zulfia";
  }

  if (
    shop.slug === "swagystan" ||
    /^(SWA6Y5TAN|SWAGYSTAN)$/i.test(
      shop.name,
    )
  ) {
    return "shop-switcher__brand shop-switcher__brand--swagystan";
  }

  return "shop-switcher__brand";
}

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
  const navigate =
    useNavigate();

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

  /*
   * Home is a real neutral landing state.
   * Hide the storefront chrome/catalog until a shop is selected.
   */
  useEffect(() => {
    const root =
      document.documentElement;

    root.classList.toggle(
      "store-home-mode",
      !selected,
    );

    return () => {
      root.classList.remove(
        "store-home-mode",
      );
    };
  }, [
    selected,
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

      /*
       * App historically treats "/" as the SWAGYSTAN data source,
       * so its old handler intentionally no-ops for this exact case.
       * Home is neutral now, therefore selecting SWAGYSTAN must expose
       * the explicit selected route.
       */
      if (
        !selected &&
        nextShop.slug ===
          "swagystan"
      ) {
        navigate(
          "/shop/swagystan",
        );
      }
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

    const currentSlug =
      visualShop.slug;

    setPressedSlug(
      currentSlug,
    );
    setMode("rail");

    try {
      await onClear();

      /*
       * Same legacy exception in App for SWAGYSTAN:
       * force the neutral Home route after the visual return animation.
       */
      if (
        currentSlug ===
        "swagystan"
      ) {
        navigate("/");
      }
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
      <section className="shop-switcher is-home">
        <div className="container shop-switcher__inner">
          <div className="shop-switcher__stage shop-switcher__stage--loading" />
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
        selected
          ? "is-selected"
          : "is-home"
      } ${
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
                y:
                  mode === "rail"
                    ? 0
                    : -4,
              }}
              transition={{
                duration: 0.14,
                ease: [
                  0.16,
                  1,
                  0.3,
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
                      aria-label={`Открыть магазин ${accessibleShopName(
                        item,
                      )}`}
                    >
                      {isMoving ? (
                        <span
                          className="shop-switcher__rail-placeholder"
                          aria-hidden="true"
                        >
                          <span
                            className={brandClass(
                              item,
                            )}
                          >
                            {displayShopName(
                              item,
                            )}
                          </span>
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
                          <span
                            className={brandClass(
                              item,
                            )}
                          >
                            {displayShopName(
                              item,
                            )}
                          </span>
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
                    duration: 0.1,
                  }}
                  onClick={() => {
                    void clearShop();
                  }}
                  disabled={pending}
                  aria-label={`Вернуться на Home из магазина ${accessibleShopName(
                    focusShop,
                  )}`}
                >
                  <motion.span
                    className="shop-switcher__name shop-switcher__name--focus"
                    layoutId={`shop-name-${focusShop.slug}`}
                    transition={{
                      layout:
                        nameMotion,
                    }}
                  >
                    <span
                      className={brandClass(
                        focusShop,
                      )}
                    >
                      {displayShopName(
                        focusShop,
                      )}
                    </span>
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence initial={false}>
            {!selected &&
              mode === "rail" && (
                <motion.div
                  className="shop-switcher__home-media"
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 8,
                  }}
                  transition={{
                    duration: 0.32,
                    ease: [
                      0.16,
                      1,
                      0.3,
                      1,
                    ],
                  }}
                >
                  <img
                    src="/eagle.JPG"
                    alt=""
                    aria-hidden="true"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                </motion.div>
              )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
}
