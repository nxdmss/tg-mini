import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Shop } from "../shopApi";

import "./ShopSwitcher.css";

type ShopSwitcherProps = {
  shop: Shop | null;
  shops: Shop[];
  loading: boolean;
  selected: boolean;
  onSelect: (shop: Shop) => void;
  onClear: () => void;
};

type NameRefs = Record<
  string,
  HTMLSpanElement | null
>;

function nextFrame() {
  return new Promise<void>(
    (resolve) => {
      window.requestAnimationFrame(
        () => {
          window.requestAnimationFrame(
            () => resolve(),
          );
        },
      );
    },
  );
}

function wait(
  duration: number,
) {
  return new Promise<void>(
    (resolve) => {
      window.setTimeout(
        resolve,
        duration,
      );
    },
  );
}

function centerRailItemInstantly(
  rail: HTMLDivElement | null,
  target: HTMLElement | null,
) {
  if (!rail || !target) {
    return;
  }

  const nextLeft =
    target.offsetLeft -
    (rail.clientWidth -
      target.offsetWidth) /
      2;

  rail.scrollLeft =
    Math.max(
      0,
      nextLeft,
    );
}

async function flyName(
  from: HTMLElement,
  to: HTMLElement,
  name: string,
) {
  const fromRect =
    from.getBoundingClientRect();

  const toRect =
    to.getBoundingClientRect();

  const fromStyle =
    window.getComputedStyle(from);

  const toStyle =
    window.getComputedStyle(to);

  const fromSize =
    Number.parseFloat(
      fromStyle.fontSize,
    ) || 24;

  const toSize =
    Number.parseFloat(
      toStyle.fontSize,
    ) || fromSize;

  const scale =
    toSize / fromSize;

  const dx =
    toRect.left -
    fromRect.left;

  const dy =
    toRect.top -
    fromRect.top;

  const ghost =
    document.createElement("div");

  ghost.className =
    "shop-name-flight";

  ghost.textContent = name;

  Object.assign(
    ghost.style,
    {
      left:
        `${fromRect.left}px`,
      top:
        `${fromRect.top}px`,
      width:
        `${Math.max(
          fromRect.width,
          1,
        )}px`,
      fontFamily:
        fromStyle.fontFamily,
      fontWeight:
        fromStyle.fontWeight,
      fontSize:
        fromStyle.fontSize,
      lineHeight:
        fromStyle.lineHeight,
      letterSpacing:
        fromStyle.letterSpacing,
      color:
        fromStyle.color,
    },
  );

  document.body.appendChild(
    ghost,
  );

  try {
    const animation =
      ghost.animate(
        [
          {
            transform:
              "translate3d(0, 0, 0) scale(1)",
            opacity: 1,
          },
          {
            offset: 0.82,
            opacity: 1,
          },
          {
            transform:
              `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`,
            opacity: 1,
          },
        ],
        {
          duration: 520,
          easing:
            "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        },
      );

    await animation.finished;
  } catch {
    // Animation cancellation is harmless.
  } finally {
    ghost.remove();
  }
}

export function ShopSwitcher({
  shop,
  shops,
  loading,
  selected,
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
    displayShop,
    setDisplayShop,
  ] =
    useState<Shop | null>(
      shop,
    );

  const [
    flyingSlug,
    setFlyingSlug,
  ] =
    useState<string | null>(
      null,
    );

  const [
    pickedSlug,
    setPickedSlug,
  ] =
    useState<string | null>(
      null,
    );

  /*
   * Important:
   * While a new shop is being loaded App still temporarily has
   * the previous shop object. We lock the intended slug so that
   * the title can never jump:
   *
   * ZULF -> SWA6Y5TAN -> ZULF
   */
  const lockedSlugRef =
    useRef<string | null>(
      selected
        ? shop?.slug ??
          null
        : null,
    );

  const mainNameRef =
    useRef<HTMLSpanElement | null>(
      null,
    );

  const railRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const railNameRefs =
    useRef<NameRefs>({});

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
    if (!shop) {
      return;
    }

    const lockedSlug =
      lockedSlugRef.current;

    if (
      lockedSlug &&
      shop.slug !==
        lockedSlug
    ) {
      return;
    }

    setDisplayShop(shop);

    if (
      lockedSlug ===
      shop.slug
    ) {
      lockedSlugRef.current =
        null;
    }
  }, [shop]);

  useEffect(() => {
    if (flyingSlug) {
      return;
    }

    if (selected) {
      setMode("focus");
      return;
    }

    lockedSlugRef.current =
      null;

    setPickedSlug(null);
    setMode("rail");
  }, [
    selected,
    flyingSlug,
  ]);

  async function selectShop(
    nextShop: Shop,
  ) {
    if (
      flyingSlug ||
      mode !== "rail"
    ) {
      return;
    }

    const from =
      railNameRefs.current[
        nextShop.slug
      ];

    /*
     * Freeze the selected shop immediately.
     * Any stale shop response is ignored until this slug arrives.
     */
    lockedSlugRef.current =
      nextShop.slug;

    setDisplayShop(
      nextShop,
    );

    setPickedSlug(
      nextShop.slug,
    );

    setFlyingSlug(
      nextShop.slug,
    );

    await nextFrame();

    const to =
      mainNameRef.current;

    setMode("focus");

    /*
     * Start loading the real route while the name is still flying.
     * The old shop object can no longer overwrite displayShop.
     */
    window.setTimeout(
      () => {
        onSelect(nextShop);
      },
      90,
    );

    if (
      from &&
      to
    ) {
      await flyName(
        from,
        to,
        nextShop.name,
      );
    } else {
      await wait(500);
    }

    setFlyingSlug(null);
    setPickedSlug(null);
  }

  async function clearShop() {
    if (
      !displayShop ||
      flyingSlug ||
      mode !== "focus"
    ) {
      return;
    }

    const target =
      railNameRefs.current[
        displayShop.slug
      ];

    /*
     * The rail is hidden here, so reposition it without smooth-scroll.
     * This avoids mobile layout/scroll fighting with the flight animation.
     */
    centerRailItemInstantly(
      railRef.current,
      target,
    );

    await nextFrame();

    const from =
      mainNameRef.current;

    const to =
      railNameRefs.current[
        displayShop.slug
      ];

    setFlyingSlug(
      displayShop.slug,
    );

    setMode("rail");

    if (
      from &&
      to
    ) {
      await flyName(
        from,
        to,
        displayShop.name,
      );
    } else {
      await wait(500);
    }

    setFlyingSlug(null);
    setPickedSlug(null);

    /*
     * Only after the visible title has safely returned to the rail
     * do we restore the neutral base state.
     */
    onClear();

    window.setTimeout(
      () => {
        if (
          railRef.current
        ) {
          railRef.current.scrollTo({
            left: 0,
            behavior:
              "smooth",
          });
        }
      },
      120,
    );
  }

  if (
    loading &&
    !displayShop
  ) {
    return (
      <section className="shop-motion shop-motion--loading">
        <div className="container">
          <div className="shop-motion__skeleton" />
        </div>
      </section>
    );
  }

  if (!displayShop) {
    return null;
  }

  return (
    <section
      className={`shop-motion ${
        mode === "rail"
          ? "is-choosing"
          : "is-focused"
      }`}
    >
      <div className="container shop-motion__inner">
        <div className="shop-motion__stage">
          <button
            type="button"
            className="shop-focus"
            onClick={() => {
              void clearShop();
            }}
            aria-hidden={
              mode !== "focus"
            }
            tabIndex={
              mode === "focus"
                ? 0
                : -1
            }
            aria-label={`Вернуть ${displayShop.name} в список магазинов`}
          >
            <span
              ref={
                mainNameRef
              }
              className={`shop-focus__name ${
                flyingSlug ===
                displayShop.slug
                  ? "is-flying"
                  : ""
              }`}
            >
              {
                displayShop.name
              }
            </span>
          </button>

          <div
            className="shop-rail-wrap"
            aria-hidden={
              mode !== "rail"
            }
          >
            <div
              ref={railRef}
              className="shop-rail"
            >
              {activeShops.map(
                (item) => (
                  <button
                    type="button"
                    key={
                      item.id
                    }
                    className={`shop-rail__item ${
                      pickedSlug ===
                      item.slug
                        ? "is-picked"
                        : ""
                    }`}
                    onClick={() => {
                      void selectShop(
                        item,
                      );
                    }}
                    tabIndex={
                      mode === "rail"
                        ? 0
                        : -1
                    }
                  >
                    <span
                      ref={(
                        node,
                      ) => {
                        railNameRefs.current[
                          item.slug
                        ] = node;
                      }}
                      className={`shop-rail__name ${
                        flyingSlug ===
                        item.slug
                          ? "is-flying"
                          : ""
                      }`}
                    >
                      {
                        item.name
                      }
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <div
          className={`shop-motion__details ${
            mode === "rail"
              ? "is-hidden"
              : ""
          }`}
        >
          {displayShop.description && (
            <p className="shop-motion__description">
              {
                displayShop.description
              }
            </p>
          )}

          <div className="shop-motion__meta">
            {
              displayShop.productCount
            } товаров
          </div>
        </div>
      </div>
    </section>
  );
}
