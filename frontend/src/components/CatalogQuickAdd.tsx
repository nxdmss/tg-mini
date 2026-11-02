import { useState } from "react";
import type { Product, ProductSize } from "../types";
import { useCart } from "../cart";
import "./CatalogQuickAdd.css";

export function CatalogQuickAdd({ product }: { product: Product }) {
  const { add, ready } = useCart();
  const [sizesOpen, setSizesOpen] = useState(false);
  const availableSizes = product.sizes.filter((size) => size.stock > 0);
  const canAdd = ready && availableSizes.length > 0;

  function addSize(size: ProductSize) {
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url,
      size: size.size,
      quantity: 1,
      maxStock: size.stock,
    });
    setSizesOpen(false);
  }

  function handleQuickAdd(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!canAdd) return;

    if (availableSizes.length === 1) {
      addSize(availableSizes[0]);
      return;
    }

    setSizesOpen((open) => !open);
  }

  return (
    <div className="swag-card-quickadd">
      <button
        type="button"
        className="swag-card-quickadd__trigger"
        onClick={handleQuickAdd}
        disabled={!canAdd}
        aria-label={availableSizes.length > 1 ? "Выбрать размер и добавить в корзину" : "Добавить в корзину"}
        aria-expanded={sizesOpen}
        aria-haspopup={availableSizes.length > 1 ? "true" : undefined}
        title={availableSizes.length > 1 ? "Выбрать размер" : "Добавить в корзину"}
      >
        <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M3.5 5h2.2l2.1 11.1a2 2 0 0 0 2 1.6h9.1a2 2 0 0 0 2-1.6L23 9H7" />
          <circle cx="11" cy="22" r="1.35" />
          <circle cx="19.2" cy="22" r="1.35" />
          <path d="M15 4.5v6m-3-3h6" />
        </svg>
      </button>

      {sizesOpen && (
        <div className="swag-card-quickadd__sizes" role="group" aria-label="Выбери размер">
          <span className="swag-card-quickadd__label">ВЫБЕРИ РАЗМЕР</span>
          {availableSizes.map((size) => (
            <button
              key={size.id}
              type="button"
              className="swag-card-quickadd__size"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                addSize(size);
              }}
            >
              {size.size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
