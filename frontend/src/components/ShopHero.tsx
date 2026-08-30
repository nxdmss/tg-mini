import type { Shop } from "../shopApi";

import "./ShopHero.css";

type ShopHeroProps = {
  shop: Shop | null;
  loading: boolean;
  onOpenSwitcher: () => void;
};

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

  return (
    <section className="shop-identity">
      <div className="container shop-identity__inner">
        <button
          type="button"
          className="shop-identity__switch"
          onClick={onOpenSwitcher}
          aria-label={`Сменить магазин. Сейчас ${shop.name}`}
        >
          <span className="shop-identity__eyebrow">
            МАГАЗИН / НАЖМИ ЧТОБЫ СМЕНИТЬ
          </span>

          <span className="shop-identity__title-row">
            <span className="shop-identity__name">
              {shop.name}
            </span>

            <span className="shop-identity__arrow" aria-hidden="true">
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
