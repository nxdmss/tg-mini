import type { Product } from "../types";
import {
  formatPrice,
  getProductPreviewImage,
} from "../utils";

export function ProductCard({
  product,
  onClick,
  index = 0,
}: {
  product: Product;
  onClick: () => void;
  index?: number;
}) {
  const image =
    getProductPreviewImage(product);

  const isDesktop =
    window.innerWidth >= 768;

  const eagerCount =
    isDesktop ? 8 : 4;

  const highPriorityCount =
    isDesktop ? 4 : 2;

  return (
    <button
      className="card"
      onClick={onClick}
      style={{
        animationDelay: `${Math.min(
          index * 60,
          480,
        )}ms`,
      }}
    >
      <div className="card__media">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading={
              index < eagerCount
                ? "eager"
                : "lazy"
            }
            fetchPriority={
              index < highPriorityCount
                ? "high"
                : "auto"
            }
            decoding="async"
          />
        ) : (
          <div className="media-fallback">
            SWA6Y5TAN
          </div>
        )}

        {!product.inStock && (
          <span className="tag-out">
            Нет в наличии
          </span>
        )}

        <span className="card__overlay">
          <span className="card__cta">
            Открыть
          </span>
        </span>
      </div>

      <div className="card__body">
        <span className="card__name">
          {product.name}
        </span>

        <span className="card__brand">
          {product.brand.name}
        </span>

        <div className="card__footer">
          <span className="card__price">
            {formatPrice(product.price)}
          </span>

          <span className="card__category">
            {product.category.name}
          </span>
        </div>
      </div>
    </button>
  );
}