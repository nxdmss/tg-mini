import type { Product } from "../types";
import { formatPrice } from "../utils";

export function ProductCard({
  product,
  onClick,
  index = 0,
}: {
  product: Product;
  onClick: () => void;
  index?: number;
}) {
  const image = product.images[0]?.url;
  return (
    <button
      className="card"
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
    >
      <div className="card__media">
        {image && <img src={image} alt={product.name} loading="lazy" />}
        {!product.inStock && <span className="tag-out">Нет в наличии</span>}
        <span className="card__overlay">
          <span className="card__cta">Открыть</span>
        </span>
      </div>
      <div className="card__body">
        <span className="card__brand">{product.brand.name}</span>
        <span className="card__name">{product.name}</span>
        <div className="card__footer">
          <span className="card__price">{formatPrice(product.price)}</span>
          <span className="card__category">{product.category.name}</span>
        </div>
      </div>
    </button>
  );
}
