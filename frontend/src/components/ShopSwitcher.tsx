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
        () => resolve(),
      );
    },
  );
}

function flyName(
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

  const ghost =
    document.createElement("div");

  ghost.className =
    "shop-name-flight";

  ghost.textContent = name;

  ghost.style.left =
    `${fromRect.left}px`;

  ghost.style.top =
    `${fromRect.top}px`;

  ghost.style.width =
    `${Math.max(
      fromRect.width,
      1,
    )}px`;

  ghost.style.fontFamily =
    fromStyle.fontFamily;

  ghost.style.fontWeight =
    fromStyle.fontWeight;

  ghost.style.fontSize =
    fromStyle.fontSize;

  ghost.style.lineHeight =
    fromStyle.lineHeight;

  ghost.style.letterSpacing =
    fromStyle.letterSpacing;

  ghost.style.color =
    fromStyle.color;

  document.body.appendChild(
    ghost,
  );

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

  const animation =
    ghost.animate(
      [
        {
          transform:
            "translate3d(0, 0, 0) scale(1)",
          opacity: 1,
        },
        {
          offset: 0.7,
          opacity: 1,
        },
        {
          transform:
            `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`,
          opacity: 1,
        },
      ],
      {
        duration: 480,
        easing:
          "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      },
    );

  return animation.finished
    .catch(() => undefined)
    .finally(() => {
      ghost.remove();
    });
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

    if (
      !flyingSlug
    ) {
      setDisplayShop(shop);
    }
  }, [
    shop,
    flyingSlug,
  ]);

  useEffect(() => {
    if (flyingSlug) {
      return;
    }

    setMode(
      selected
        ? "focus"
        : "rail",
    );

    if (!selected) {
      setPickedSlug(null);
    }
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

    const to =
      mainNameRef.current;

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

    setMode("focus");

    window.setTimeout(
      () => {
        onSelect(nextShop);
      },
      115,
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
      await new Promise<void>(
        (resolve) => {
          window.setTimeout(
            resolve,
            420,
          );
        },
      );
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

    target?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

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
      await new Promise<void>(
        (resolve) => {
          window.setTimeout(
            resolve,
            420,
          );
        },
      );
    }

    setFlyingSlug(null);
    setPickedSlug(null);

    onClear();

    window.setTimeout(
      () => {
        railRef.current?.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      },
      80,
    );
  }

  if (
    loading &&
    !displayShop
  ) {
    return (
      <section className="shop-motion shop-motion--loading">
        <div className="container">
          <div className="shop-motion__label">
            МАГАЗИН
          </div>

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
        <div className="shop-motion__label">
          МАГАЗИН
        </div>

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
