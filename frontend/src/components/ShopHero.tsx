import type { Shop } from "../shopApi";

import "./ShopHero.css";

type ShopHeroProps = {
  shop: Shop | null;
  loading: boolean;
  onOpenSwitcher: () => void;
};

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

export function ShopHero({
  shop,
  loading,
  onOpenSwitcher,
}: ShopHeroProps) {
  if (loading && !shop) {
    return (
      <section className="shop-identity shop-identity--loading">
        <div className="container shop-identity__inner">
          <div className="shop-identity__skeleton" />
        </div>
      </section>
    );
  }

  if (!shop) {
    return null;
  }

  const isZulfia =
    shop.slug === "zulf";

  const isSwagystan =
    shop.slug === "swagystan" ||
    /^(SWA6Y5TAN|SWAGYSTAN)$/i.test(
      shop.name,
    );

  return (
    <section className="shop-identity">
      <div className="container shop-identity__inner">
        <button
          type="button"
          className="shop-identity__switch"
          onClick={onOpenSwitcher}
          aria-label={`Сменить магазин. Сейчас ${accessibleShopName(
            shop,
          )}`}
        >
          <span className="shop-identity__eyebrow">
            МАГАЗИН / НАЖМИ ЧТОБЫ СМЕНИТЬ
          </span>

          <span className="shop-identity__title-row">
            <span className="shop-identity__name">
              <span
                className={
                  isZulfia
                    ? "brand-zulfia"
                    : isSwagystan
                      ? "brand-swagystan"
                      : undefined
                }
              >
                {displayShopName(
                  shop,
                )}
              </span>
            </span>

            <span
              className="shop-identity__arrow"
              aria-hidden="true"
            >
              ↓
            </span>
          </span>

          <span className="shop-identity__meta">
            {shop.productCount} товаров
          </span>
        </button>

        {shop.description && (
          <p className="shop-identity__description">
            {shop.description}
          </p>
        )}
      </div>
    </section>
  );
}
