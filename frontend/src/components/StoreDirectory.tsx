import { motion } from "motion/react";
import type { Shop } from "../shopApi";

type StoreDirectoryProps = {
  shops: Shop[];
  loading: boolean;
  onOpen: (shop: Shop) => void;
};

function displayName(shop: Shop) {
  if (shop.slug === "zulf") return "Zulfia";
  if (shop.slug === "swagystan" || /^(SWA6Y5TAN|SWAGYSTAN)$/i.test(shop.name)) return "swagystan";
  return shop.name;
}

export function StoreDirectory({ shops, loading, onOpen }: StoreDirectoryProps) {
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
        {active.map((shop, index) => (
          <motion.button
            type="button"
            className={`store-tile ${shop.slug === "zulf" ? "store-tile--zulfia" : ""} ${shop.slug === "swagystan" ? "store-tile--swagystan" : ""}`}
            key={shop.id}
            style={{ background: shop.backgroundColor, color: shop.textColor }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onOpen(shop)}
          >
            <span className="store-tile__name">{displayName(shop)}</span>
            <span className="store-tile__meta">{shop.productCount} товаров</span>
          </motion.button>
        ))}
      </div>
    </main>
  );
}
