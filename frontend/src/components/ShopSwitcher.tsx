import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
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
  duration: 0.7,
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
  const reducedMotion = useReducedMotion();
  const moveTransition = reducedMotion ? { duration: 0 } : nameMotion;
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

  const homeMediaRef = useRef<HTMLDivElement>(null);
  const [fadingMedia, setFadingMedia] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

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
    const mediaRect = homeMediaRef.current?.getBoundingClientRect();
    if (mediaRect) {
      setFadingMedia({
        top: mediaRect.top,
        left: mediaRect.left,
        width: mediaRect.width,
        height: mediaRect.height,
      });
    }
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
    <>
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
          <motion.div
            layout
            className="shop-switcher__stage"
            transition={{ layout: moveTransition }}
          >
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
                duration: reducedMotion ? 0 : 0.38,
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
                              moveTransition,
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
                    duration: reducedMotion ? 0 : 0.38,
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
                        moveTransition,
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
          </motion.div>

            {!selected && (
                <motion.div
                  ref={homeMediaRef}
                  className="shop-switcher__home-media"
                  style={{ visibility: mode === "rail" && !fadingMedia ? "visible" : "hidden" }}
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: mode === "rail" && !fadingMedia ? 1 : 0,
                  }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.85,
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
        </LayoutGroup>
      </div>
    </section>
    {fadingMedia && createPortal(
      <motion.div
        className="shop-switcher__home-media shop-switcher__home-media--fading"
        style={fadingMedia}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => setFadingMedia(null)}
        aria-hidden="true"
      >
        <img src="/eagle.JPG" alt="" />
      </motion.div>,
      document.body,
    )}
    </>
  );
}
