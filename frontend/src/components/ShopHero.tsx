import type { Shop } from "../shopApi";

import "./ShopHero.css";

type ShopHeroProps = {
  shop: Shop | null;
  loading: boolean;
};

export function ShopHero({
  shop,
  loading,
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
        <div className="shop-identity__copy">
          <div className="shop-identity__eyebrow">
            МАГАЗИН
          </div>

          <h1 className="shop-identity__name">
            {shop.name}
          </h1>

          {shop.description && (
            <p className="shop-identity__description">
              {shop.description}
            </p>
          )}

          <div className="shop-identity__meta">
            {shop.productCount} товаров
          </div>
        </div>
      </div>
    </section>
  );
}
