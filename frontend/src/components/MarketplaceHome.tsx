import {
  useEffect,
  useState,
} from "react";
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
  const [
    visible,
    setVisible,
  ] = useState(false);

  useEffect(() => {
    const frame =
      window.requestAnimationFrame(
        () => {
          setVisible(true);
        },
      );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );
    };
  }, []);

  return (
    <main
      className={`market-home ${
        visible
          ? "is-visible"
          : ""
      } ${
        openingSlug
          ? "is-opening"
          : ""
      }`}
    >
      <div className="container market-home__inner">
        <div className="market-home__eyebrow">
          SWAG / STORES
        </div>

        <div className="market-home__head">
          <h1>
            МАГАЗИНЫ
          </h1>

          <span>
            {shops.length}
          </span>
        </div>

        <div className="market-home__rule" />

        {loading ? (
          <div className="market-home__loading">
            <div />
            <div />
          </div>
        ) : shops.length === 0 ? (
          <div className="market-home__empty">
            МАГАЗИНОВ ПОКА НЕТ
          </div>
        ) : (
          <div className="market-stores">
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
                    className={`market-store ${
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
                  >
                    <span className="market-store__number">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <span className="market-store__main">
                      <span className="market-store__name">
                        {
                          shop.name
                        }
                      </span>

                      {shop.description && (
                        <span className="market-store__description">
                          {
                            shop.description
                          }
                        </span>
                      )}
                    </span>

                    <span className="market-store__side">
                      <span className="market-store__count">
                        {
                          shop.productCount
                        }{" "}
                        ТОВАРОВ
                      </span>

                      <span className="market-store__arrow">
                        →
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>
        )}

        <div className="market-home__bottom">
          ВЫБЕРИ МАГАЗИН
        </div>
      </div>
    </main>
  );
}
