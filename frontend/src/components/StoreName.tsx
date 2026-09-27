import { motion } from "motion/react";

import type { Shop } from "../shopApi";

type StoreNameProps = {
  shop: Shop;
  place: "tile" | "current";
  reducedMotion?: boolean;
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

export function StoreName({
  shop,
  place,
  reducedMotion = false,
}: StoreNameProps) {
  const swag = isSwagystan(shop);
  const name = displayName(shop);

  return (
    <motion.span
      className={`store-name store-name--${place} ${
        swag ? "store-name--swag" : ""
      } ${shop.slug === "zulf" ? "store-name--zulfia" : ""}`}
      layoutId={`store-name-${shop.slug}`}
      transition={{
        layout: {
          duration: reducedMotion ? 0 : 0.72,
          ease: [0.16, 1, 0.3, 1],
        },
      }}
    >
      {swag ? (
        <img
          className="store-name__swag-wordmark"
          src="/swagystan-label.svg"
          alt=""
          aria-hidden="true"
        />
      ) : (
        name
      )}
    </motion.span>
  );
}
