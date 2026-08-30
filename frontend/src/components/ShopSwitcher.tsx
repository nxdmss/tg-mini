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
  onSelect: (shop: Shop) => void;
};

type NameRefs = Record<
  string,
  HTMLSpanElement | null
>;

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
          offset: 0.72,
          opacity: 1,
        },
        {
          transform:
            `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`,
          opacity: 1,
        },
      ],
      {
        duration: 470,
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
  onSelect,
}: ShopSwitcherProps) {
  const [chooserOpen, setChooserOpen] =
    useState(false);

  const [displayShop, setDisplayShop] =
    useState<Shop | null>(shop);

  const [flyingSlug, setFlyingSlug] =
    useState<string | null>(null);

  const [pickedSlug, setPickedSlug] =
    useState<string | null>(null);

  const mainNameRef =
    useRef<HTMLSpanElement | null>(
      null,
    );

  const railNameRefs =
    useRef<NameRefs>({});

  const sortedShops = useMemo(
    () =>
      shops.filter(
        (item) => item.isActive,
      ),
    [shops],
  );

  useEffect(() => {
    if (!shop) {
      return;
    }

    if (!pickedSlug) {
      setDisplayShop(shop);
    }

    if (
      pickedSlug === shop.slug
    ) {
      setDisplayShop(shop);
      setPickedSlug(null);
    }
  }, [
    shop,
    pickedSlug,
  ]);

  useEffect(() => {
    if (!chooserOpen) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key === "Escape" &&
        displayShop
      ) {
        void closeChooser(
          displayShop,
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  });

  async function openChooser() {
    if (
      !displayShop ||
      chooserOpen ||
      flyingSlug
    ) {
      return;
    }

    const from =
      mainNameRef.current;

    const railTarget =
      railNameRefs.current[
        displayShop.slug
      ];

    if (!from || !railTarget) {
      setChooserOpen(true);
      return;
    }

    railTarget.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "center",
    });

    await new Promise<void>(
      (resolve) => {
        window.requestAnimationFrame(
          () => resolve(),
        );
      },
    );

    const to =
      railNameRefs.current[
        displayShop.slug
      ];

    if (!to) {
      setChooserOpen(true);
      return;
    }

    setFlyingSlug(
      displayShop.slug,
    );

    setChooserOpen(true);

    await flyName(
      from,
      to,
      displayShop.name,
    );

    setFlyingSlug(null);
  }

  async function closeChooser(
    nextShop: Shop,
  ) {
    if (flyingSlug) {
      return;
    }

    const from =
      railNameRefs.current[
        nextShop.slug
      ];

    const to =
      mainNameRef.current;

    setPickedSlug(
      nextShop.slug,
    );

    setDisplayShop(
      nextShop,
    );

    setFlyingSlug(
      nextShop.slug,
    );

    window.setTimeout(() => {
      setChooserOpen(false);
    }, 70);

    if (
      shop?.slug !==
      nextShop.slug
    ) {
      window.setTimeout(() => {
        onSelect(nextShop);
      }, 110);
    }

    if (from && to) {
      await flyName(
        from,
        to,
        nextShop.name,
      );
    } else {
      await new Promise(
        (resolve) =>
          window.setTimeout(
            resolve,
            360,
          ),
      );
    }

    setFlyingSlug(null);
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
        chooserOpen
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
              void openChooser();
            }}
            aria-label={`Выбрать другой магазин. Сейчас ${displayShop.name}`}
          >
            <span
              ref={mainNameRef}
              className={`shop-focus__name ${
                flyingSlug ===
                displayShop.slug
                  ? "is-flying"
                  : ""
              }`}
            >
              {displayShop.name}
            </span>
          </button>

          <div
            className="shop-rail-wrap"
            aria-hidden={!chooserOpen}
          >
            <div className="shop-rail">
              {sortedShops.map(
                (item) => {
                  const isCurrent =
                    item.slug ===
                    displayShop.slug;

                  const isPicked =
                    item.slug ===
                    pickedSlug;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      className={`shop-rail__item ${
                        isCurrent
                          ? "is-current"
                          : ""
                      } ${
                        isPicked
                          ? "is-picked"
                          : ""
                      }`}
                      onClick={() => {
                        void closeChooser(
                          item,
                        );
                      }}
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
                        {item.name}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>

        <div
          className={`shop-motion__details ${
            chooserOpen
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
