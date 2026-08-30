import { useEffect } from "react";

import type { Shop } from "../shopApi";

import "./ShopSwitcher.css";

type ShopSwitcherProps = {
  open: boolean;
  shops: Shop[];
  activeShopId?: string;
  onClose: () => void;
  onSelect: (shop: Shop) => void;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function ShopSwitcher({
  open,
  shops,
  activeShopId,
  onClose,
  onSelect,
}: ShopSwitcherProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={`shop-switcher ${
        open ? "is-open" : ""
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="shop-switcher__backdrop"
        aria-label="Закрыть выбор магазина"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />

      <section
        className="shop-switcher__sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Выбор магазина"
      >
        <div className="shop-switcher__grabber" />

        <div className="shop-switcher__head">
          <div>
            <div className="shop-switcher__eyebrow">
              SWAG SELECT
            </div>

            <h2>МАГАЗИНЫ</h2>
          </div>

          <button
            type="button"
            className="shop-switcher__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="shop-switcher__list">
          {shops.map((shop, index) => {
            const active = shop.id === activeShopId;

            return (
              <button
                type="button"
                key={shop.id}
                className={`shop-switcher__item ${
                  active ? "is-active" : ""
                }`}
                onClick={() => onSelect(shop)}
              >
                <span className="shop-switcher__number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="shop-switcher__item-main">
                  <strong>{shop.name}</strong>

                  <small>
                    {formatCount(shop.productCount)} товаров
                  </small>
                </span>

                <span className="shop-switcher__item-action">
                  {active ? "СЕЙЧАС" : "→"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
