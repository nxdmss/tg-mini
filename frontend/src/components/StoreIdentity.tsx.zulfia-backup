import type { Shop } from "../shopApi";

import "./StoreIdentity.css";

type StoreIdentityProps = {
  shop: Shop;
  leaving: boolean;
  onBack: () => void;
};

export function StoreIdentity({
  shop,
  leaving,
  onBack,
}: StoreIdentityProps) {
  return (
    <section
      className={`store-identity ${
        leaving
          ? "is-leaving"
          : ""
      }`}
    >
      <div className="container store-identity__inner">
        <button
          type="button"
          className="store-identity__back"
          onClick={onBack}
        >
          <span>←</span>
          НАЗАД
        </button>

        <h1 className="store-identity__name">
          {shop.name}
        </h1>

        <div className="store-identity__bottom">
          {shop.description ? (
            <p>
              {shop.description}
            </p>
          ) : (
            <span />
          )}

          <span>
            {shop.productCount} ТОВАРОВ
          </span>
        </div>
      </div>
    </section>
  );
}
