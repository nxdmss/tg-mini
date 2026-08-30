import type {
  CSSProperties,
} from "react";

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
                    aria-label={`Открыть магазин ${shop.name}`}
                  >
                    {shop.name}
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
