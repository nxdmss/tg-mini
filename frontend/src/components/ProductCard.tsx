import type { Product } from "../types";
import { formatPrice } from "../utils";

export function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: () => void;
}) {
  const image = product.images[0]?.url;
  return (
    <button className="card" onClick={onClick}>
      <div className="card__media">
        {image && <img src={image} alt={product.name} loading="lazy" />}
        {!product.inStock && <span className="tag-out">Нет в наличии</span>}
      </div>
      <span className="card__brand">{product.brand.name}</span>
      <span className="card__name">{product.name}</span>
      <span className="card__price">{formatPrice(product.price)}</span>
    </button>
  );
}
