import type { CSSProperties } from "react";

import type { Shop } from "../shopApi";

import { SwagLogo } from "./SwagLogo";

import "./MarketplaceHome.css";

type MarketplaceHomeProps = {
  shops: Shop[];
  loading: boolean;
  openingSlug: string | null;
  onOpen: (shop: Shop) => void;
};

export function MarketplaceHome({
  shops,
  loading,
  openingSlug,
  onOpen,
}: MarketplaceHomeProps) {
  return (
    <main className={`market-home ${openingSlug ? "is-opening" : ""}`}>
      <div className="container market-home__inner">
        {!openingSlug && (
          <div className="market-home__hero-logo">
            <SwagLogo />
          </div>
        )}

        {loading ? (
          <div className="market-store-row market-store-row--loading">
            <span />
            <span />
          </div>
        ) : shops.length === 0 ? (
          <div className="market-store-row market-store-row--empty">
            МАГАЗИНОВ ПОКА НЕТ
          </div>
        ) : (
          <div className="market-store-row">
            {shops.map((shop, index) => (
              <button
                type="button"
                key={shop.id}
                className={`market-store-word ${
                  openingSlug === shop.slug ? "is-opening" : ""
                } ${
                  openingSlug && openingSlug !== shop.slug
                    ? "is-muted"
                    : ""
                }`}
                style={{ "--store-index": index } as CSSProperties}
                onClick={() => onOpen(shop)}
                disabled={Boolean(openingSlug)}
              >
                <span>
                  {shop.slug === "zulf" ? "Zulfia" : shop.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
