import type { CSSProperties } from "react";

import { SwagLogo } from "./SwagLogo";

import type { Shop } from "../shopApi";

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
    <main
      className={`market-home ${
        openingSlug
          ? "is-opening"
          : ""
      }`}
    >
      <div className="container market-home__inner">
        <div className="market-home__hero-logo"><SwagLogo /></div>
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
            {shops.map(
              (
                shop,
                index,
              ) => {
                const isOpening =
                  openingSlug ===
                  shop.slug;

                const isMuted =
                  Boolean(
                    openingSlug,
                  ) &&
                  !isOpening;

                return (
                  <button
                    type="button"
                    key={shop.id}
                    className={`market-store-word ${
                      isOpening
                        ? "is-opening"
                        : ""
                    } ${
                      isMuted
                        ? "is-muted"
                        : ""
                    }`}
                    style={{
                      "--store-index":
                        index,
                    } as CSSProperties}
                    onClick={() =>
                      onOpen(shop)
                    }
                    disabled={
                      Boolean(
                        openingSlug,
                      )
                    }
                    aria-label={`Открыть магазин $<span className={shop.slug === "zulf" ? "shop-name--zulfia" : undefined}>{shop.slug === "zulf" ? "Zulfia" : shop.name}</span>`}
                  >
                    <span className={shop.slug === "zulf" ? "shop-name--zulfia" : undefined}>{shop.slug === "zulf" ? "Zulfia" : shop.name}</span>
                  </button>
                );
              },
            )}
          </div>
        )}
      </div>
    </main>
  );
}
