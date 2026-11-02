import { useState } from "react";
import type { Product, ProductSize } from "../types";
import { useCart } from "../cart";
import { CartIcon } from "./CartIcon";
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
        <CartIcon count={0} showCount={false} className="swag-card-quickadd__icon" />
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
