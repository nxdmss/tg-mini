import { motion } from "motion/react";

import type { Shop } from "../shopApi";

type StoreDirectoryProps = {
  shops: Shop[];
  loading: boolean;
  onOpen: (shop: Shop) => void;
};

function isSwagystan(shop: Shop) {
  return (
    shop.slug === "swagystan" ||
    /^(SWA6Y5TAN|SWAGYSTAN)$/i.test(shop.name)
  );
}

function displayName(shop: Shop) {
  if (shop.slug === "zulf") {
    return "Zulfia";
  }

  if (isSwagystan(shop)) {
    return "SWAGYSTAN";
  }

  return shop.name;
}

function storeArtwork(shop: Shop) {
  if (shop.slug === "swagystan") {
    return "/store-swag.png";
  }

  if (shop.slug === "zulf") {
    return "/store-zulfia.png";
  }

  return null;
}

export function StoreDirectory({
  shops,
  loading,
  onOpen,
}: StoreDirectoryProps) {
  const active = shops.filter((shop) => shop.isActive);

  if (loading && active.length === 0) {
    return (
      <main className="container store-directory">
        <div className="store-directory__grid">
          <div className="store-tile store-tile--skeleton" />
          <div className="store-tile store-tile--skeleton" />
        </div>
      </main>
    );
  }

  return (
    <main className="container store-directory">
      <div className="store-directory__grid">
        {active.map((shop, index) => {
          const artwork = storeArtwork(shop);
          const name = displayName(shop);
          const swag = isSwagystan(shop);

          return (
            <motion.button
              type="button"
              className="store-tile"
              key={shop.id}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.46,
                delay: index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => onOpen(shop)}
              aria-label={`Открыть магазин ${name}`}
            >
              <span className="store-tile__shine" aria-hidden="true" />

              {artwork ? (
                <div className="store-tile__art-wrap">
                  <img
                    className={`store-tile__art ${
                      shop.slug === "swagystan"
                        ? "store-tile__art--swag"
                        : ""
                    }`}
                    src={artwork}
                    alt=""
                    aria-hidden="true"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              ) : (
                <span className="store-tile__fallback">{name}</span>
              )}

              <span
                className={`store-tile__label ${
                  swag ? "store-tile__label--swag" : ""
                }`}
              >
                {swag ? (
                  <img
                    className="store-tile__swag-wordmark"
                    src="/swagystan-label.svg"
                    alt=""
                    aria-hidden="true"
                  />
                ) : (
                  name
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    </main>
  );
}
